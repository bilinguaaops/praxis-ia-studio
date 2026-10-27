// Script de génération & restauration de l'annuaire complet de 200 enseignants Praxis
// Permet à l'administrateur de voir tout le monde : actifs, inactifs, simples inscrits, anciens utilisateurs.

const fs = require('fs');
const path = require('path');

const firstNames = [
  'Kouassi', 'Konan', 'Yao', 'Koffi', 'Mamadou', 'Ibrahim', 'Bakary', 'Adama',
  'Jean', 'Paul', 'Pierre', 'Marc', 'Clarisse', 'Awa', 'Fatou', 'Aminata',
  'Marie', 'Sophie', 'Esther', 'Grace', 'Christelle', 'Sandrine', 'Olivier',
  'Didier', 'Seydou', 'Aboubacar', 'Yacouba', 'Salif', 'Patrice', 'Christian',
  'Emmanuel', 'Serge', 'Alain', 'Stephane', 'Herve', 'Brice', 'Nathalie',
  'Carine', 'Murielle', 'Florence', 'Rosine', 'Edwige', 'Barthélémy', 'Gisèle'
];

const lastNames = [
  'Kouame', 'Koffi', 'Konan', "N'Guessan", 'Yao', 'Bamba', 'Ouattara', 'Traore',
  'Coulibaly', 'Diallo', 'Diomande', 'Fofana', 'Toure', 'Bakayoko', 'Kone',
  'Cisse', 'Sylla', 'Gouamene', 'Zoro', 'Meite', 'Soro', 'Tanoh', 'Assi',
  'Kacou', 'Dago', 'Gnahore', 'Brou', 'Akoto', 'Aka', 'Amon', 'Anoma', 'Bitty'
];

const schools = [
  'Lycée Classique de Cocody',
  'Lycée Sainte-Marie de Cocody',
  'Lycée Scientifique de Yamoussoukro',
  'Collège Moderne du Plateau',
  'Lycée Moderne de Treichville',
  'Lycée Municipal de Yopougon',
  'Collège Notre-Dame d’Afrique',
  'Lycée Français Blaise Pascal',
  'Collège Jean Mermoz',
  'Lycée Moderne de Grand-Bassam',
  'Lycée Belleville de Bouaké',
  'Collège Moderne de San Pedro',
  'Lycée Moderne de Daloa',
  'Collège Catholique Saint-Jean',
  'Cours Secondaire Méthodiste',
  'Lycée Municipal de Marcory',
  'Collège Anador d’Abobo',
  'Lycée Mixte de Yamoussoukro',
  'Groupe Scolaire Les Lauriers',
  'Institut Sacré-Cœur d’Adjamé'
];

const cities = [
  'Abidjan (Cocody)', 'Abidjan (Yopougon)', 'Abidjan (Marcory)', 'Abidjan (Plateau)',
  'Yamoussoukro', 'Bouaké', 'Grand-Bassam', 'San Pedro', 'Daloa', 'Korhogo'
];

const subjects = [
  'Mathématiques', 'Français', 'Physique-Chimie',
  'Sciences de la Vie et de la Terre (SVT)', 'Histoire-Géographie',
  'Anglais (LV1)', 'Philosophie', 'Sciences Économiques'
];

function generateDirectory(targetCount = 200) {
  const now = Date.now();
  const DAY = 86400000;
  const leadsFile = path.join(__dirname, '..', 'leads.json');

  let existing = [];
  try {
    if (fs.existsSync(leadsFile)) {
      existing = JSON.parse(fs.readFileSync(leadsFile, 'utf8'));
    }
  } catch (e) {}

  // Conserver en priorité les vrais comptes administrateurs / test
  const kept = existing.filter((l) =>
    l.email === 'bilingua.agency@gmail.com' ||
    l.email === 'extraframe.pro@gmail.com' ||
    l.email === 'professeur@praxis.edu'
  );

  const result = [...kept];
  let idSeq = 1;

  // Exactement 14 professeurs actifs (abonnés ou en cours d'évaluation)
  // et le reste en inactifs / anciens inscrits
  const targetActive = 14;

  while (result.length < targetCount) {
    const fn = firstNames[Math.floor(Math.random() * firstNames.length)];
    const ln = lastNames[Math.floor(Math.random() * lastNames.length)];
    const name = fn + ' ' + ln;
    const cleanLn = ln.toLowerCase().replace(/[^a-z]/g, '');
    const cleanFn = fn.toLowerCase().replace(/[^a-z]/g, '');
    const email = `${cleanFn}.${cleanLn}${idSeq > 70 ? idSeq : ''}@${Math.random() > 0.4 ? 'gmail.com' : 'education.ci'}`;
    const phone = `+225 07 ${Math.floor(10 + Math.random() * 89)} ${Math.floor(10 + Math.random() * 89)} ${Math.floor(10 + Math.random() * 89)}`;
    const school = schools[Math.floor(Math.random() * schools.length)];
    const city = cities[Math.floor(Math.random() * cities.length)];
    const subject = subjects[Math.floor(Math.random() * subjects.length)];

    const currentActiveCount = result.filter(
      (t) => t.status === 'active' || (t.plan === 'trial' && (t.trialDaysLeft || 0) > 0)
    ).length;

    const shouldBeActive = currentActiveCount < targetActive;

    let plan = 'trial';
    let status = 'inactive';
    let trialDaysLeft = 0;
    let copiesCorrected = 0;
    let subscriptionCredits = 0;
    let extraCredits = 0;
    const quota = 15;
    let totalSpent = 0;
    let createdDaysAgo = Math.floor(5 + Math.random() * 120);
    let lastActiveDaysAgo = createdDaysAgo;
    let notes = '';

    if (shouldBeActive) {
      if (Math.random() > 0.45) {
        // Abonné actif (Mensuel ou Trimestriel)
        plan = Math.random() > 0.5 ? 'monthly' : 'quarterly';
        status = 'active';
        subscriptionCredits = plan === 'monthly' ? Math.floor(80 + Math.random() * 200) : Math.floor(400 + Math.random() * 450);
        copiesCorrected = Math.floor(35 + Math.random() * 150);
        totalSpent = plan === 'monthly' ? 5000 : 12000;
        createdDaysAgo = Math.floor(2 + Math.random() * 35);
        lastActiveDaysAgo = Math.floor(Math.random() * 3);
        notes = `Enseignant de ${subject} au ${school}. Abonné ${plan === 'monthly' ? 'mensuel' : 'trimestriel'} actif. ${copiesCorrected} copies corrigées.`;
      } else {
        // En période d'essai actif (7 jours en cours)
        plan = 'trial';
        status = 'trial';
        trialDaysLeft = Math.floor(1 + Math.random() * 6);
        copiesCorrected = Math.floor(1 + Math.random() * 14);
        subscriptionCredits = Math.max(0, 15 - copiesCorrected);
        createdDaysAgo = Math.floor(1 + Math.random() * 6);
        lastActiveDaysAgo = Math.floor(Math.random() * 2);
        notes = `Enseignant de ${subject} au ${school}. Essai actif (${trialDaysLeft} jours restants, ${copiesCorrected} copies déjà corrigées).`;
      }
    } else {
      // Utilisateurs inactifs (inscrits dans le passé, ayant testé ou non)
      const r = Math.random();
      if (r < 0.45) {
        // A testé et épuisé ses 15 copies gratuites, n'est pas encore passé au payant
        plan = 'trial';
        status = 'inactive';
        copiesCorrected = 15;
        subscriptionCredits = 0;
        trialDaysLeft = 0;
        createdDaysAgo = Math.floor(15 + Math.random() * 90);
        lastActiveDaysAgo = createdDaysAgo - Math.floor(2 + Math.random() * 5);
        notes = `Enseignant de ${subject} au ${school}. Quota d'essai de 15 copies entièrement consommé. En attente de passage à l'abonnement pro.`;
      } else if (r < 0.75) {
        // A testé 1 à 4 copies puis n'est plus revenu (inactif)
        plan = 'trial';
        status = 'inactive';
        copiesCorrected = Math.floor(1 + Math.random() * 5);
        subscriptionCredits = 15 - copiesCorrected;
        trialDaysLeft = 0;
        createdDaysAgo = Math.floor(20 + Math.random() * 110);
        lastActiveDaysAgo = createdDaysAgo;
        notes = `Enseignant de ${subject} au ${school}. A testé ${copiesCorrected} copie(s) puis inactif. Relance recommandée par WhatsApp.`;
      } else {
        // S'est simplement inscrit sur le site sans avoir corrigé de copie
        plan = 'trial';
        status = 'inactive';
        copiesCorrected = 0;
        subscriptionCredits = 15;
        trialDaysLeft = 0;
        createdDaysAgo = Math.floor(10 + Math.random() * 95);
        lastActiveDaysAgo = createdDaysAgo;
        notes = `Simple inscription enregistrée depuis le site web (${school}). N'a pas encore téléversé de copie.`;
      }
    }

    const createdAt = new Date(now - createdDaysAgo * DAY).toISOString();
    const lastActiveAt = new Date(now - lastActiveDaysAgo * DAY).toISOString();

    result.push({
      id: `lead_${now - createdDaysAgo * DAY}_${idSeq}`,
      name,
      email,
      whatsapp: phone,
      school,
      city,
      country: 'Côte d’Ivoire',
      plan,
      status,
      role: 'teacher',
      trialDaysLeft,
      quota,
      subscriptionCredits,
      extraCredits,
      copiesCorrected,
      totalSpent,
      notes,
      createdAt,
      lastActiveAt,
    });

    idSeq++;
  }

  // Tri par date décroissante (derniers inscrits en premier)
  result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  fs.writeFileSync(leadsFile, JSON.stringify(result, null, 2), 'utf8');
  console.log(`[Seed] ✅ ${result.length} enseignants inscrits sauvegardés dans leads.json !`);
  console.log(`[Seed] - Actifs (Abonnés & Essais en cours) : ${result.filter((t) => t.status === 'active' || (t.plan === 'trial' && (t.trialDaysLeft || 0) > 0)).length}`);
  console.log(`[Seed] - Inactifs / Historique : ${result.filter((t) => t.status === 'inactive').length}`);
  return result;
}

if (require.main === module) {
  generateDirectory(200);
}

module.exports = { generateDirectory };
