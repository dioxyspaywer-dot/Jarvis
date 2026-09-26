// Serveur proxy JARVIS <-> Gemini
// Rôle : c'est LUI qui détient la clé API Gemini, jamais le téléphone.
// L'app Android n'appelle que ce serveur, sur /plan.

require('dotenv').config();
const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: 'gemini-2.0-flash',
  generationConfig: { responseMimeType: 'application/json' }
});

const SYSTEM_INSTRUCTION = `
Tu es JARVIS, un agent qui contrôle un téléphone Android par la voix.
Réponds UNIQUEMENT en JSON valide, avec cette forme exacte :
{
  "spokenReply": "phrase courte à dire à l'utilisateur en français",
  "actions": [
    {
      "type": "OPEN_APP | OPEN_SETTINGS_WIFI | OPEN_SETTINGS_BLUETOOTH | SEARCH_YOUTUBE | OPEN_BROWSER_SEARCH | GO_HOME | GO_BACK | SCROLL_DOWN | TAP_TEXT | TYPE_TEXT | SPEAK | UNKNOWN",
      "target": "nom de l'app, texte cherché, ou texte du bouton (ou null)",
      "value": "texte à écrire si TYPE_TEXT (ou null)",
      "requiresConfirmation": true ou false
    }
  ]
}
Mets requiresConfirmation à true pour : envoyer un message, supprimer des données,
faire un achat, ou toute action irréversible.
N'ajoute aucun texte en dehors du JSON.
`;

app.post('/plan', async (req, res) => {
  try {
    const { utterance, history = [], screenContext } = req.body;

    if (!utterance || typeof utterance !== 'string') {
      return res.status(400).json({ error: 'utterance manquant' });
    }

    const historyText = history
      .map((h) => `${h.role === 'user' ? 'Utilisateur' : 'JARVIS'}: ${h.text}`)
      .join('\n');

    const prompt = [
      SYSTEM_INSTRUCTION,
      screenContext ? `Contexte de l'écran actuel: ${screenContext}` : '',
      historyText ? `Historique récent:\n${historyText}` : '',
      `Nouvelle demande de l'utilisateur: "${utterance}"`
    ].filter(Boolean).join('\n\n');

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    let plan;
    try {
      plan = JSON.parse(text);
    } catch (e) {
      return res.status(502).json({ error: 'Réponse Gemini non-JSON', raw: text });
    }

    res.json(plan);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Erreur serveur' });
  }
});

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Serveur JARVIS démarré sur le port ${port}`);
});
