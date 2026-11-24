"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export type SiteLocale = "en" | "fr";

const french: Record<string, string> = {
  "Primary School(National Curriculum)": "École primaire (programme national)",
  "Secondary School(National Curriculum)": "École secondaire (programme national)",
  "Musical Instruments": "Instruments de musique",
  "Cambridge Early Years": "Petite enfance Cambridge",
  "Cambridge Primary": "Primaire Cambridge",
  "Cambridge Lower Secondary": "Premier cycle secondaire Cambridge",
  "Cambridge Upper Secondary": "Second cycle secondaire Cambridge",
  "Language Coaching & Exam Preparation": "Cours de langues et préparation aux examens",
  "Video Production & Filmmaking": "Production vidéo et réalisation de films",
  "Professional Photography": "Photographie professionnelle",
  "Graphic Design": "Graphisme",
  "Deejaying (DJing)": "Mixage DJ",
  "Professional Web Design & Development": "Conception et développement web professionnels",
  "Software Development": "Développement logiciel",
  "Artificial Intelligence & Generative AI": "Intelligence artificielle et IA générative",
  "Digital Marketing": "Marketing numérique",
  "Ages 5 to 11": "De 5 à 11 ans", "Ages 11 to 14": "De 11 à 14 ans", "Ages 14 to 16": "De 14 à 16 ans", "Age 3+": "Dès 3 ans", "All Ages": "Tous âges", "Short Course": "Formation courte",
  "Forum for certified professional teachers": "La plateforme des enseignants professionnels certifiés",
  "Trusted educators providing personalized home and online coaching": "Des enseignants de confiance pour un accompagnement personnalisé à domicile et en ligne",
  "Previous program": "Programme précédent", "Next program": "Programme suivant",
  "Show ": "Afficher ", "No Programs Available": "Aucun programme disponible",
  "We're currently updating our curriculum. Please check back soon for our new learning paths.": "Nous mettons actuellement notre programme à jour. Revenez bientôt découvrir nos nouveaux parcours d’apprentissage.",
  "Our Categories": "Nos programmes", "Learning paths for every goal": "Des parcours d’apprentissage pour chaque objectif",
  "every goal": "chaque objectif",
  "How It ": "Comment ça ", "Works": "marche", "Three simple steps to find the perfect tutor and start growing.": "Trois étapes simples pour trouver l’enseignant idéal et progresser.",
  "Why Choose ": "Pourquoi choisir ", "Premium features built around safety, comfort, and better learning outcomes for you.": "Des services de qualité conçus pour votre sécurité, votre confort et votre réussite.",
  "Privacy ": "Confidentialité", "Policy": "et données personnelles", "Terms of ": "Conditions d’", "Service": "utilisation",
  "Explore our learning categories and find the perfect fit for you.": "Explorez nos programmes et trouvez celui qui vous convient.",
  "We're currently expanding our offerings. Please check back later or contact us for custom tutoring needs.": "Nous élargissons actuellement notre offre. Revenez plus tard ou contactez-nous pour un accompagnement personnalisé.",
  "Request a Custom Category": "Demander un programme personnalisé", "Show more": "Voir plus", "Read more": "En savoir plus",
  "Show Details": "Voir les détails", "Request a Teacher": "Demander un enseignant", "Back to Programs": "Retour aux programmes",
  "Available programs": "Programmes disponibles", "Available ": "Programmes ", "Programs": "Programmes",
  "Available Programs": "Programmes disponibles", "Core curriculum covered": "Programme de base couvert", "Request Teacher": "Demander un enseignant", "No programs added yet.": "Aucun programme n’a encore été ajouté.",
  "Choose a specialized path within ": "Choisissez un parcours spécialisé en ", " to find the perfect tutor.": " pour trouver l’enseignant idéal.",
  "Included Subjects:": "Matières incluses :", "General study topics": "Matières générales", "No courses have been added yet.": "Aucun cours n’a encore été ajouté.",
  "Ready to Find the Right Teacher for You?": "Prêt à trouver l’enseignant qui vous convient ?",
  "Connect with qualified and trusted teachers who match your learning needs, goals, location, and preferred learning style. Whether you’re learning a new subject, developing a skill, preparing for an exam, or pursuing professional growth, CoachPlus Academy helps you find the right teacher for your journey.": "Trouvez des enseignants qualifiés et de confiance, adaptés à vos besoins, vos objectifs, votre lieu et votre style d’apprentissage. Que vous découvriez une matière, développiez une compétence, prépariez un examen ou progressiez professionnellement, CoachPlus Academy vous accompagne.",
  "Get Started Now": "Commencer", "Join as a Teacher": "Rejoindre comme enseignant",
  "Tell us what you need": "Dites-nous ce dont vous avez besoin", "Choose the learning category, course of interest, schedule, goals, and whether lessons should happen online or at home.": "Choisissez le programme, le cours, l’horaire et vos objectifs, puis indiquez si vous préférez des cours en ligne ou à domicile.",
  "Meet matched teachers": "Rencontrez des enseignants adaptés", "We find the great educators by specialty, availability, reviews, and the teaching style that fits you.": "Nous sélectionnons des enseignants selon leur spécialité, leurs disponibilités, leurs avis et leur méthode pédagogique.",
  "Start learning with confidence": "Apprenez en toute confiance", "Book recurring sessions and keep every lesson centered around measurable growth.": "Planifiez vos séances et faites de chaque cours une étape concrète de votre progression.",
  "Verified Teachers": "Enseignants vérifiés", "Every teacher profile is thoroughly vetted for qualifications, experience, and trust.": "Chaque profil est vérifié afin de confirmer les qualifications, l’expérience et la fiabilité de l’enseignant.",
  "Flexible Scheduling": "Horaires flexibles", "Choose online or home coaching on weekdays or weekends that fit your daily schedule.": "Choisissez des cours en ligne ou à domicile, en semaine ou le week-end, selon votre emploi du temps.",
  "Personalized Plans": "Parcours personnalisés", "Lessons are tailored specifically to your learning goals, current pace, and target confidence.": "Les cours sont adaptés à vos objectifs, à votre rythme et à la confiance que vous souhaitez acquérir.",
  "Safe & Trusted Learning": "Un apprentissage sûr et fiable", "A transparent, fully managed experience delivering top-quality coaching without stress or guesswork.": "Un accompagnement transparent et encadré, pour des cours de qualité en toute sérénité.",
  "Platform": "Plateforme", "Legal": "Informations légales", "Application Status": "Suivi de candidature", "Privacy Policy": "Confidentialité", "Terms of Service": "Conditions d’utilisation", "Cookie Policy": "Politique relative aux cookies",
  "Student": "Élève", "Teacher": "Enseignant", "Back Home": "Retour à l’accueil", "Welcome back": "Ravi de vous revoir", "Sign in to continue your learning journey": "Connectez-vous pour poursuivre votre parcours d’apprentissage", "Email Address": "Adresse e-mail", "Password": "Mot de passe", "Toggle password visibility": "Afficher ou masquer le mot de passe", "Sign In": "Se connecter", "Restricted access area. Unauthorized access is prohibited.": "Zone d’accès réservé. Tout accès non autorisé est interdit.", "New to CoachPlus Academy?": "Nouveau sur CoachPlus Academy ?", "Create an account": "Créer un compte", "Forgot your password?": "Mot de passe oublié ?",
  "Your Success Starts with the Right Coach.": "Votre réussite commence avec le bon enseignant.", "Learn on the go — get the CoachPlus app.": "Apprenez partout avec l’application CoachPlus.",
  "Ready to start ": "Prêt à commencer à ", "learning?": "apprendre ?", "Get matched today with a certified teacher tailored precisely to your learning goals.": "Trouvez dès aujourd’hui un enseignant certifié adapté à vos objectifs d’apprentissage.",
  "Not sure where to start?": "Vous ne savez pas par où commencer ?", "Need help choosing?": "Besoin d’aide pour choisir ?", "Tell CoachPlus Academy your goals and we'll recommend the best category and tutor match.": "Parlez-nous de vos objectifs et CoachPlus Academy vous recommandera le programme et l’enseignant adaptés.",
  "Logout": "Déconnexion", "Home": "Accueil", "Categories": "Programmes", "How It Works": "Comment ça marche", "Why Choose Us": "Pourquoi nous choisir", "Become a Teacher": "Devenir enseignant",
  "Language / Langue": "Langue / Language",
  "Loading...": "Chargement…", "Request a": "Demander un", "Request Sent Successfully!": "Demande envoyée avec succès !", "Request not sent": "Demande non envoyée", "Choose a Category": "Choisir un programme", "Please select at least one course": "Veuillez choisir au moins un cours", "Please choose a learning mode": "Veuillez choisir un mode d’apprentissage", "Select days and set times": "Choisissez les jours et les horaires", "Set a from and to time for ": "Indiquez une heure de début et de fin pour ", "Request Sent!": "Demande envoyée !", "Student or Guardian Name": "Nom de l’élève ou du responsable", "Primary Phone Number": "Numéro de téléphone principal", "Secondary Phone Number (Optional)": "Deuxième numéro de téléphone (facultatif)", "Country": "Pays", "City": "Ville", "Preferred Start Date": "Date de début souhaitée", "From": "De", "To": "À", "e.g. Rwanda": "Ex. : Rwanda", "e.g. Kigali": "Ex. : Kigali", "Home Coaching": "Cours à domicile", "Online Coaching": "Cours en ligne", "Coaching Center": "Centre de formation",
};

const programTerms: Record<string, string> = {
  "Primary": "Primaire", "Primary School": "École primaire", "Secondary": "Secondaire", "Secondary School": "École secondaire", "All Levels": "Tous les niveaux", "Beginner": "Débutant", "Intermediate": "Intermédiaire", "Advanced": "Avancé",
  "Mathematics": "Mathématiques", "Math": "Mathématiques", "English": "Anglais", "French": "Français", "Kinyarwanda": "Kinyarwanda", "Science": "Sciences", "Physics": "Physique", "Chemistry": "Chimie", "Biology": "Biologie", "History": "Histoire", "Geography": "Géographie", "Computer Science": "Informatique", "Languages": "Langues", "Business": "Commerce",
};

export function useSiteLocale(): SiteLocale {
  const [locale, setLocale] = useState<SiteLocale>("en");
  const pathname = usePathname();
  useEffect(() => {
    const readLocale = () => {
      const pathLocale = window.location.pathname.match(/^\/(en|fr)(?:\/|$)/)?.[1];
      const cookieLocale = document.cookie.split("; ").find((item) => item.startsWith("site-locale="))?.split("=")[1];
      setLocale(pathLocale === "fr" || cookieLocale === "fr" ? "fr" : "en");
    };
    readLocale();
    window.addEventListener("site-locale-change", readLocale);
    return () => window.removeEventListener("site-locale-change", readLocale);
  }, [pathname]);
  return locale;
}

export function t(locale: SiteLocale, value: string): string {
  if (locale !== "fr") return value;
  if (french[value]) return french[value];
  let translated = value;
  for (const [english, frenchTerm] of Object.entries(programTerms).sort(([a], [b]) => b.length - a.length)) {
    const escapedTerm = english.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    translated = translated.replace(new RegExp(`\\b${escapedTerm}\\b`, "g"), frenchTerm);
  }
  return translated;
}

export function localizedContent(locale: SiteLocale, english: string, french?: string | null): string {
  return locale === "fr" ? (french?.trim() || t(locale, english)) : english;
}

export function localizedDatabaseText(locale: SiteLocale, english: string, french?: string | null): string {
  return locale === "fr" ? (french?.trim() || english) : english;
}
