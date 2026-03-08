const User = require('../models/User');
const { bucket } = require('../config/firebase');
const axios = require('axios');
const pdf = require('pdf-parse');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

// AI Analysis function using Groq
async function analyzeWithAI(resumeText, userData, githubData = null) {
    const prompt = generateAnalysisPrompt(resumeText, userData, githubData);
    
    try {
        console.log('🤖 Calling Groq API with model: llama-3.3-70b-versatile');
        
        const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: 'llama-3.3-70b-versatile',
            messages: [
                {
                    role: 'system',
                    content: 'You are an expert resume analyzer and career advisor. Analyze resumes and provide scores and improvement tips. Always respond in JSON format.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.7,
            max_tokens: 2000
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        return parseAnalysisResponse(response.data.choices[0].message.content);
    } catch (error) {
        console.error('AI API Error:', error.response?.data || error.message);
        throw new Error('AI analysis failed: ' + error.message);
    }
}

function generateAnalysisPrompt(resumeText, userData, githubData) {
    const { userType, domain, cgpa } = userData;
    
    if (userType === 'technical') {
        return `Analyze this technical resume and GitHub profile for a ${domain} position. Return ONLY valid JSON:

Resume Content:
${resumeText}

GitHub Data:
${githubData ? JSON.stringify(githubData) : 'No GitHub data provided'}

CGPA: ${cgpa}/10

IMPORTANT WEIGHTAGE FOR SCORING:
- Technical Skills: 30%
- DSA/Problem Solving: 20%
- Projects: 15%
- CGPA: 10%
- Experience: 20% (based on work history, internships, years of experience)
- Resume Quality: 5% (format, presentation, clarity)

Return this exact JSON structure:
{
  "score": (number 0-100),
  "skillsAnalysis": {
    "technical": ["skill1", "skill2"],
    "strengths": ["strength1", "strength2"],
    "gaps": ["gap1", "gap2"],
    "recommendations": ["rec1", "rec2"]
  },
  "projectsAnalysis": {
    "count": (number),
    "quality": "string",
    "recommendations": ["rec1", "rec2"]
  },
  "tips": "detailed improvement tips string",
  "domainRecommendations": "domain-specific advice string"
}`;
    } else {
        return `Analyze this non-technical resume for a ${domain} position. Return ONLY valid JSON:

Resume Content:
${resumeText}

CGPA: ${cgpa}/10

🎯 WEIGHTAGE FOR NON-TECHNICAL USERS:
- Domain Knowledge/Skills: 30%
- Experience: 40% (work history, internships, years of experience)
- CGPA: 15%
- Resume Quality: 10% (format, presentation, clarity)
- Projects/Achievements: 5%

Return this exact JSON structure:
{
  "score": (number 0-100),
  "skillsAnalysis": {
    "strengths": ["strength1", "strength2"],
    "gaps": ["gap1", "gap2"],
    "recommendations": ["rec1", "rec2"]
  },
  "resumeQuality": {
    "format": "string",
    "content": "string",
    "improvements": ["imp1", "imp2"]
  },
  "tips": "detailed improvement tips string",
  "domainRecommendations": "domain-specific advice string"
}`;
    }
}

function parseAnalysisResponse(aiResponse) {
    try {
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        throw new Error('No JSON found in response');
    } catch (error) {
        console.error('Error parsing AI response:', error);
        return {
            score: 70,
            skillsAnalysis: { strengths: ['Analysis pending'], gaps: ['Try again'] },
            tips: 'Unable to analyze at this moment. Please try again.'
        };
    }
}

exports.analyzeResume = async (req, res) => {
    try {
        const userId = req.user.uid;
        console.log('📥 Analysis request for user:', userId);
        
        const user = await User.findOne({ firebaseUid: userId });
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const pdfBuffer = req.file.buffer;
        const pdfData = await pdf(pdfBuffer);
        const resumeText = pdfData.text;
        console.log('✅ PDF parsed, length:', resumeText.length);

        let githubData = null;
        if (user.userType === 'technical' && user.githubProfile) {
            const githubUsername = extractGithubUsername(user.githubProfile);
            if (githubUsername) {
                githubData = await fetchGithubData(githubUsername);
                console.log('✅ GitHub data fetched');
            }
        }

        console.log('🤖 Calling AI for analysis...');
        const analysis = await analyzeWithAI(resumeText, user, githubData);
        console.log('✅ Analysis complete, score:', analysis.score);

        user.analyses.push({
            hireMeScore: analysis.score,
            feedback: analysis.tips,
            skillsAnalysis: analysis,
            resumeText: resumeText.substring(0, 500)
        });
        await user.save();
        console.log('✅ Analysis saved to user history');

        res.json({
            success: true,
            analysis: analysis,
            message: 'Analysis completed successfully (file not stored)'
        });

    } catch (error) {
        console.error('❌ Analysis error:', error);
        res.status(500).json({ 
            error: 'Analysis failed: ' + error.message,
            details: error.response?.data || 'No additional details'
        });
    }
};

// Helper functions for GitHub
async function fetchGithubData(username) {
    try {
        const reposResponse = await axios.get(`https://api.github.com/users/${username}/repos`);
        const repos = reposResponse.data;

        const languages = {};
        for (const repo of repos.slice(0, 5)) {
            const langResponse = await axios.get(repo.languages_url);
            Object.assign(languages, langResponse.data);
        }

        return {
            repos: repos.map(repo => ({
                name: repo.name,
                description: repo.description,
                stars: repo.stargazers_count,
                language: repo.language,
                url: repo.html_url
            })),
            languages,
            totalRepos: repos.length
        };
    } catch (error) {
        console.error('GitHub fetch error:', error);
        return null;
    }
}

function extractGithubUsername(url) {
    if (!url) return null;
    const match = url.match(/github\.com\/([^\/]+)/);
    return match ? match[1] : null;
}

// ⚠️ THIS PART IS CRITICAL - MAKE SURE IT EXISTS ⚠️
// Middleware for file upload
exports.uploadMiddleware = upload.single('resume');