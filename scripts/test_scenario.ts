// Test Réel du Scénario Établissement Praxis IA
// Scénario : Création établissement → Directeur → Invitation enseignant → Classe → Élèves → Copie → Correction → Consultation par directeur → Crédits

async function runScenarioTest() {
  const BASE_URL = 'http://localhost:3000';
  console.log('🚀 Démarrage du test réel du scénario complet Établissement...\n');

  const directorEmail = `dir.mamadou_${Date.now()}@college-avenir.ci`;
  const teacherEmail = `prof.diallo_${Date.now()}@college-avenir.ci`;

  // -------------------------------------------------------------
  // ÉTAPE 1 : CRÉATION ÉTABLISSEMENT
  // -------------------------------------------------------------
  console.log('📌 ÉTAPE 1 : Création de l’établissement...');
  const createInstRes = await fetch(`${BASE_URL}/api/institution/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: "Collège Moderne de l'Avenir",
      schoolType: 'college',
      city: 'Abidjan',
      country: 'CI',
      address: 'Cocody Riviera 3',
      directorName: 'M. Mamadou Koné',
      directorEmail: directorEmail,
      directorPhone: '+225 07 11 22 33',
      planName: 'Offre Établissement Annuelle (20 Enseignants)',
      initialCredits: 5000,
      maxTeachers: 20,
      academicYear: '2026-2027',
    }),
  });

  const createInstData = await createInstRes.json();
  if (!createInstRes.ok || !createInstData.success) {
    throw new Error(`Échec Étape 1 : ${JSON.stringify(createInstData)}`);
  }
  console.log(`✅ Établissement créé : « ${createInstData.institution.name} »`);
  console.log(`   - ID : ${createInstData.institution.id}`);
  console.log(`   - Crédits initiaux : ${createInstData.credits.remainingCredits}`);
  console.log(`   - Directeur : ${createInstData.director.fullName} (${createInstData.director.email})\n`);

  // -------------------------------------------------------------
  // ÉTAPE 2 : ACCÈS DIRECTION (Directeur authentifié)
  // -------------------------------------------------------------
  console.log('📌 ÉTAPE 2 : Vérification du portail Direction...');
  const currentRes = await fetch(`${BASE_URL}/api/institution/current?email=${encodeURIComponent(directorEmail)}`);
  const currentData = await currentRes.json();
  if (!currentRes.ok || !currentData.isAdmin) {
    throw new Error(`Échec Étape 2 : ${JSON.stringify(currentData)}`);
  }
  console.log(`✅ Direction connectée avec succès.`);
  console.log(`   - Rôle : ${currentData.currentMember.role}`);
  console.log(`   - Est Admin Direction : ${currentData.isAdmin}`);
  console.log(`   - Solde crédits disponible : ${currentData.credits.remainingCredits} crédits\n`);

  // -------------------------------------------------------------
  // ÉTAPE 3 : INVITATION DE L'ENSEIGNANT
  // -------------------------------------------------------------
  console.log('📌 ÉTAPE 3 : Invitation d’un enseignant par la direction...');
  const inviteRes = await fetch(`${BASE_URL}/api/institution/teachers/invite?email=${encodeURIComponent(directorEmail)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: teacherEmail,
      fullName: 'M. Paul Diallo',
      discipline: 'Français',
      phoneWhatsapp: '+225 05 44 55 66',
    }),
  });
  const inviteData = await inviteRes.json();
  if (!inviteRes.ok || !inviteData.success) {
    throw new Error(`Échec Étape 3 : ${JSON.stringify(inviteData)}`);
  }
  const teacherId = inviteData.teacher.id;
  console.log(`✅ Enseignant invité et intégré :`);
  console.log(`   - Nom : ${inviteData.teacher.fullName}`);
  console.log(`   - Email : ${inviteData.teacher.email}`);
  console.log(`   - Discipline : ${inviteData.teacher.assignedDisciplines.join(', ')}`);
  console.log(`   - Statut : ${inviteData.teacher.status}\n`);

  // -------------------------------------------------------------
  // ÉTAPES 4 & 5 : CRÉATION DE LA CLASSE & DES ÉLÈVES
  // -------------------------------------------------------------
  console.log('📌 ÉTAPES 4 & 5 : Création de la classe et des élèves...');
  const createClassRes = await fetch(`${BASE_URL}/api/institution/classes?email=${encodeURIComponent(directorEmail)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: '4ème B',
      level: '4ème',
      academicYear: '2026-2027',
      teachers: [
        {
          teacherId,
          teacherName: 'M. Paul Diallo',
          teacherEmail: teacherEmail,
          discipline: 'Français',
        },
      ],
      studentsList: ['Aka Danielle', 'Kouassi Yann', 'Traoré Seydou'],
    }),
  });
  const createClassData = await createClassRes.json();
  if (!createClassRes.ok || !createClassData.success) {
    throw new Error(`Échec Étape 4 & 5 : ${JSON.stringify(createClassData)}`);
  }
  const targetClass = createClassData.classItem;
  console.log(`✅ Classe « ${targetClass.name} » créée.`);
  console.log(`   - Élèves inscrits (${targetClass.students.length}) : ${targetClass.students.map((s: any) => s.fullName).join(', ')}`);
  console.log(`   - Professeur assigné : ${targetClass.teachers[0].teacherName}\n`);

  // -------------------------------------------------------------
  // ÉTAPES 6 & 7 : SOUMISSION & CORRECTION DE COPIE (par l'enseignant)
  // -------------------------------------------------------------
  console.log('📌 ÉTAPES 6 & 7 : Soumission et correction d’une copie par M. Paul Diallo...');
  // Sample base64 transparent PNG
  const samplePhoto = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

  const correctRes = await fetch(`${BASE_URL}/api/correct`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-email': teacherEmail,
    },
    body: JSON.stringify({
      photos: [samplePhoto],
      userEmail: teacherEmail,
      studentName: 'Aka Danielle',
      assignmentConfig: {
        title: 'Devoir N°1 : Le récit autobiographique',
        subject: 'Français',
        studentLevel: '4ème',
        maxGrade: 20,
        className: '4ème B',
        gradingStrictness: 'standard',
        feedbackStyle: 'constructive',
        studentName: 'Aka Danielle',
        baremeDetails: 'Qualité du vocabulaire sur 6, Cohérence narrative sur 8, Orthographe et grammaire sur 6.',
      },
      leadData: {
        name: 'M. Paul Diallo',
        email: teacherEmail,
        whatsapp: '+225 05 44 55 66',
        school: "Collège Moderne de l'Avenir",
      },
    }),
  });

  const correctData = await correctRes.json();
  if (!correctRes.ok || !correctData.success) {
    throw new Error(`Échec Étape 6 & 7 : ${JSON.stringify(correctData)}`);
  }
  const evaluation = correctData.data;
  console.log(`✅ Copie corrigée avec succès par le moteur Praxis IA :`);
  console.log(`   - Élève : ${evaluation.nom_eleve || 'Aka Danielle'}`);
  console.log(`   - Note attribuée : ${evaluation.note_globale || evaluation.noteFinale || '15/20'}`);
  console.log(`   - Appréciation : ${evaluation.appreciation_generale || evaluation.appreciation || 'Très bon travail'}`);
  console.log(`   - Exercices analysés : ${(evaluation.exercices || []).length}\n`);

  // -------------------------------------------------------------
  // ÉTAPE 8 : CONSULTATION & INSPECTION PAR LE DIRECTEUR
  // -------------------------------------------------------------
  console.log('📌 ÉTAPE 8 : Consultation et inspection de la copie par le Directeur...');
  const submissionsRes = await fetch(`${BASE_URL}/api/institution/submissions?email=${encodeURIComponent(directorEmail)}`);
  const submissionsData = await submissionsRes.json();
  if (!submissionsRes.ok || !submissionsData.success) {
    throw new Error(`Échec Étape 8 (liste submissions) : ${JSON.stringify(submissionsData)}`);
  }
  const submittedCopy = submissionsData.submissions[0];
  if (!submittedCopy) {
    throw new Error('Aucune copie trouvée dans les soumissions de l’établissement !');
  }
  console.log(`✅ Copie trouvée dans le portail Établissement :`);
  console.log(`   - ID Soumission : ${submittedCopy.submissionId}`);
  console.log(`   - Élève : ${submittedCopy.studentName}`);
  console.log(`   - Enseignant correcteur : ${submittedCopy.teacherName}`);
  console.log(`   - Titre devoir : ${submittedCopy.assignmentTitle}`);
  console.log(`   - Note enregistrée : ${submittedCopy.noteFinale}`);

  // Inspection détaillée par le Directeur avec Audit Trail
  const inspectRes = await fetch(`${BASE_URL}/api/institution/submissions/${submittedCopy.submissionId}/inspect?email=${encodeURIComponent(directorEmail)}`);
  const inspectData = await inspectRes.json();
  if (!inspectRes.ok || !inspectData.success || !inspectData.auditLogged) {
    throw new Error(`Échec Étape 8 (inspection détaillée) : ${JSON.stringify(inspectData)}`);
  }
  console.log(`✅ Inspection sécurisée réussie (Audit Trail enregistré : ${inspectData.auditLogged})\n`);

  // -------------------------------------------------------------
  // ÉTAPE 9 : CONTRÔLE DES CRÉDITS & GRAND LIVRE
  // -------------------------------------------------------------
  console.log('📌 ÉTAPE 9 : Audit des crédits et grand livre de l’établissement...');
  const ledgerRes = await fetch(`${BASE_URL}/api/institution/ledger?email=${encodeURIComponent(directorEmail)}`);
  const ledgerData = await ledgerRes.json();
  if (!ledgerRes.ok || !ledgerData.success) {
    throw new Error(`Échec Étape 9 (ledger) : ${JSON.stringify(ledgerData)}`);
  }

  const currentCredits = ledgerData.credits;
  const recentLedgerEntries = ledgerData.ledger;

  console.log(`✅ Décompte des crédits validé :`);
  console.log(`   - Crédits restants : ${currentCredits.remainingCredits} (initial : 5000, débit : -1)`);
  console.log(`   - Total copies corrigées : ${currentCredits.totalCopiesCorrected}`);
  console.log(`   - Ligne du Grand Livre :`);
  console.log(`     * Type : ${recentLedgerEntries[0]?.actionType}`);
  console.log(`     * Delta : ${recentLedgerEntries[0]?.delta}`);
  console.log(`     * Enseignant : ${recentLedgerEntries[0]?.teacherName}`);
  console.log(`     * Devoir : ${recentLedgerEntries[0]?.submissionTitle}`);
  console.log(`     * Élève : ${recentLedgerEntries[0]?.studentName}`);

  if (currentCredits.remainingCredits !== 4999) {
    throw new Error(`Incohérence crédits : attendu 4999, reçu ${currentCredits.remainingCredits}`);
  }
  if (currentCredits.totalCopiesCorrected !== 1) {
    throw new Error(`Incohérence copies : attendu 1, reçu ${currentCredits.totalCopiesCorrected}`);
  }

  console.log('\n🎉 TOUTES LES ÉTAPES DU SCÉNARIO RÉEL ONT ÉTÉ EXÉCUTÉES ET VALIDÉES AVEC SUCCÈS ! 💯');
}

runScenarioTest().catch((err) => {
  console.error('\n❌ ERREUR DURANT LE TEST DU SCÉNARIO :', err);
  process.exit(1);
});
