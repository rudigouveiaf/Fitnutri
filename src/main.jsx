import React, { useState, useEffect, useMemo } from 'react';
import {
  Dumbbell, Apple, Plus, Trash2, ChevronLeft, ChevronRight, Check, X, History, Home,
  TrendingUp, Activity, Beef, Wheat, Droplet, LogOut, UserPlus, Edit3, Save, Target,
  Scale, Sparkles, ArrowRight, ArrowLeft, Star, Info, ChefHat, Lightbulb, GlassWater,
  ListChecks, ChevronDown, ChevronUp, Search
} from 'lucide-react';

// ============================================
// STORAGE ADAPTER (localStorage)
// ============================================
const storage = {
  async get(key) {
    try {
      const v = localStorage.getItem(key);
      return v ? { key, value: v } : null;
    } catch { return null; }
  },
  async set(key, value) {
    try { localStorage.setItem(key, value); return { key, value }; }
    catch (e) { console.error(e); return null; }
  },
  async list(prefix) {
    try {
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(prefix)) keys.push(k);
      }
      return { keys, prefix };
    } catch { return { keys: [], prefix }; }
  },
  async delete(key) {
    try { localStorage.removeItem(key); return { key, deleted: true }; }
    catch { return null; }
  }
};

// ============================================
// DONNÉES
// ============================================
const PROFILE_COLORS = ['#d4ff3a', '#ff6b9d', '#5ce1e6', '#ffa94d', '#c084fc', '#ff5252', '#69db7c', '#ffd43b', '#74c0fc', '#f783ac'];

const ACTIVITY_LEVELS = [
  { id: 'sedentary', label: 'Sédentaire', desc: 'Bureau, peu de marche', mult: 1.2 },
  { id: 'light', label: 'Légère', desc: '1-3 séances / semaine', mult: 1.375 },
  { id: 'moderate', label: 'Modérée', desc: '3-5 séances / semaine', mult: 1.55 },
  { id: 'active', label: 'Active', desc: '6-7 séances / semaine', mult: 1.725 },
  { id: 'very_active', label: 'Très active', desc: 'Sport quotidien intense', mult: 1.9 },
];

const GOALS = [
  { id: 'cut', label: 'Sèche', desc: 'Déficit calorique pour perdre de la masse grasse en gardant le muscle', adjust: -500, proteinPerKg: 2.2, accent: '#5ce1e6', macroSplit: { p: 35, c: 35, f: 30 } },
  { id: 'maintain', label: 'Maintien', desc: 'Maintenir son poids et améliorer sa forme générale', adjust: 0, proteinPerKg: 1.8, accent: '#ffd43b', macroSplit: { p: 25, c: 45, f: 30 } },
  { id: 'lean_bulk', label: 'Prise de muscle', desc: 'Léger surplus pour gagner du muscle sans excès de gras', adjust: 250, proteinPerKg: 2.0, accent: '#69db7c', macroSplit: { p: 28, c: 47, f: 25 } },
  { id: 'bulk', label: 'Prise de masse', desc: 'Surplus important pour maximiser prise de poids et de force', adjust: 500, proteinPerKg: 2.0, accent: '#ff6b9d', macroSplit: { p: 22, c: 53, f: 25 } },
];

const EXERCISES = [
  { name: 'Développé couché', cat: 'Pectoraux', type: 'strength', muscles: 'Pectoraux · Triceps · Deltoïdes ant.', tip: 'Omoplates serrées et basses, descends la barre au sternum, pieds bien ancrés au sol.', reps: { cut: { s: 3, r: '10-12', t: 60 }, maintain: { s: 3, r: '8-12', t: 90 }, lean_bulk: { s: 4, r: '8-10', t: 90 }, bulk: { s: 5, r: '4-6', t: 180 } } },
  { name: 'Développé incliné haltères', cat: 'Pectoraux', type: 'strength', muscles: 'Pectoraux sup. · Deltoïdes ant.', tip: 'Banc à 30-45°. Coudes à 45° du corps, contraction au point haut.', reps: { cut: { s: 3, r: '10-12', t: 60 }, maintain: { s: 3, r: '10-12', t: 75 }, lean_bulk: { s: 4, r: '8-12', t: 90 }, bulk: { s: 4, r: '6-10', t: 120 } } },
  { name: 'Pompes', cat: 'Pectoraux', type: 'strength', muscles: 'Pectoraux · Triceps · Gainage', tip: 'Corps gainé en planche, mains sous épaules, descends jusqu\'à ce que la poitrine effleure le sol.', reps: { cut: { s: 4, r: 'max', t: 45 }, maintain: { s: 3, r: '12-20', t: 60 }, lean_bulk: { s: 4, r: '10-15', t: 75 }, bulk: { s: 4, r: '8-12', t: 90 } } },
  { name: 'Écarté couché', cat: 'Pectoraux', type: 'strength', muscles: 'Pectoraux (isolation)', tip: 'Bras légèrement fléchis tout au long. Mouvement circulaire, sens l\'étirement en bas.', reps: { cut: { s: 3, r: '12-15', t: 45 }, maintain: { s: 3, r: '12-15', t: 60 }, lean_bulk: { s: 3, r: '10-12', t: 75 }, bulk: { s: 3, r: '10-12', t: 90 } } },
  { name: 'Dips', cat: 'Pectoraux', type: 'strength', muscles: 'Pectoraux bas · Triceps', tip: 'Buste penché en avant pour cibler les pecs, vertical pour les triceps.', reps: { cut: { s: 3, r: '10-12', t: 60 }, maintain: { s: 3, r: '8-12', t: 75 }, lean_bulk: { s: 4, r: '8-12', t: 90 }, bulk: { s: 4, r: '6-10', t: 120 } } },
  { name: 'Tractions', cat: 'Dos', type: 'strength', muscles: 'Dorsaux · Biceps · Rhomboïdes', tip: 'Prise un peu plus large que les épaules, monte menton au-dessus de la barre.', reps: { cut: { s: 4, r: 'max', t: 75 }, maintain: { s: 3, r: '6-10', t: 90 }, lean_bulk: { s: 4, r: '6-10', t: 120 }, bulk: { s: 5, r: '5-8', t: 150 } } },
  { name: 'Rowing barre', cat: 'Dos', type: 'strength', muscles: 'Dorsaux · Rhomboïdes · Trapèzes', tip: 'Dos plat penché à 45°, tire la barre vers le nombril, contracte les omoplates au point haut.', reps: { cut: { s: 3, r: '10-12', t: 60 }, maintain: { s: 3, r: '8-12', t: 90 }, lean_bulk: { s: 4, r: '8-10', t: 90 }, bulk: { s: 4, r: '5-8', t: 150 } } },
  { name: 'Tirage poulie haute', cat: 'Dos', type: 'strength', muscles: 'Dorsaux · Biceps', tip: 'Tire la barre vers la poitrine, coudes vers le bas, pas de balancement.', reps: { cut: { s: 3, r: '10-12', t: 60 }, maintain: { s: 3, r: '10-12', t: 75 }, lean_bulk: { s: 4, r: '8-12', t: 90 }, bulk: { s: 4, r: '6-10', t: 120 } } },
  { name: 'Soulevé de terre', cat: 'Dos', type: 'strength', muscles: 'Chaîne post. · Dorsaux · Fessiers · Ischios', tip: 'Dos plat impératif. Barre près des tibias, pousse dans le sol, hanches et épaules montent ensemble.', reps: { cut: { s: 3, r: '6-8', t: 90 }, maintain: { s: 3, r: '5-8', t: 120 }, lean_bulk: { s: 4, r: '5-8', t: 150 }, bulk: { s: 5, r: '3-5', t: 240 } } },
  { name: 'Rowing haltère', cat: 'Dos', type: 'strength', muscles: 'Dorsaux · Rhomboïdes', tip: 'Un genou et une main sur le banc, dos plat. Tire le coude vers le ciel.', reps: { cut: { s: 3, r: '10-12', t: 60 }, maintain: { s: 3, r: '8-12', t: 75 }, lean_bulk: { s: 4, r: '8-10', t: 90 }, bulk: { s: 4, r: '6-10', t: 120 } } },
  { name: 'Développé militaire', cat: 'Épaules', type: 'strength', muscles: 'Deltoïdes · Triceps', tip: 'Debout ou assis, gaine les abdos, pousse la barre à la verticale.', reps: { cut: { s: 3, r: '10-12', t: 60 }, maintain: { s: 3, r: '8-12', t: 90 }, lean_bulk: { s: 4, r: '6-10', t: 90 }, bulk: { s: 5, r: '5-8', t: 150 } } },
  { name: 'Élévations latérales', cat: 'Épaules', type: 'strength', muscles: 'Deltoïdes latéraux', tip: 'Haltères légères. Monte jusqu\'à la ligne des épaules.', reps: { cut: { s: 3, r: '12-15', t: 45 }, maintain: { s: 3, r: '12-15', t: 60 }, lean_bulk: { s: 4, r: '10-15', t: 60 }, bulk: { s: 4, r: '10-12', t: 75 } } },
  { name: 'Oiseau', cat: 'Épaules', type: 'strength', muscles: 'Deltoïdes postérieurs', tip: 'Penché en avant, dos plat. Écarte les bras vers l\'extérieur.', reps: { cut: { s: 3, r: '12-15', t: 45 }, maintain: { s: 3, r: '12-15', t: 60 }, lean_bulk: { s: 3, r: '12-15', t: 60 }, bulk: { s: 3, r: '10-12', t: 75 } } },
  { name: 'Curl biceps', cat: 'Bras', type: 'strength', muscles: 'Biceps', tip: 'Coudes collés au corps, monte sans balancer, contraction au sommet.', reps: { cut: { s: 3, r: '10-12', t: 45 }, maintain: { s: 3, r: '10-12', t: 60 }, lean_bulk: { s: 4, r: '8-12', t: 75 }, bulk: { s: 4, r: '6-10', t: 90 } } },
  { name: 'Curl marteau', cat: 'Bras', type: 'strength', muscles: 'Biceps · Brachial · Avant-bras', tip: 'Prise neutre (pouces vers le haut). Idéal pour épaissir le bras.', reps: { cut: { s: 3, r: '10-12', t: 45 }, maintain: { s: 3, r: '10-12', t: 60 }, lean_bulk: { s: 3, r: '8-12', t: 75 }, bulk: { s: 4, r: '8-10', t: 90 } } },
  { name: 'Extension triceps', cat: 'Bras', type: 'strength', muscles: 'Triceps', tip: 'Coudes fixes près des oreilles, étire le triceps en bas.', reps: { cut: { s: 3, r: '10-12', t: 45 }, maintain: { s: 3, r: '10-12', t: 60 }, lean_bulk: { s: 4, r: '10-12', t: 75 }, bulk: { s: 4, r: '8-10', t: 90 } } },
  { name: 'Barre au front', cat: 'Bras', type: 'strength', muscles: 'Triceps (long chef)', tip: 'Allongé, coudes pointés vers le plafond, descends la barre vers le front.', reps: { cut: { s: 3, r: '10-12', t: 45 }, maintain: { s: 3, r: '8-12', t: 60 }, lean_bulk: { s: 4, r: '8-12', t: 75 }, bulk: { s: 4, r: '6-10', t: 90 } } },
  { name: 'Squat', cat: 'Jambes', type: 'strength', muscles: 'Quadriceps · Fessiers · Ischios · Gainage', tip: 'Pieds largeur épaules, descends comme si tu t\'asseyais, genoux dans l\'axe des pieds.', reps: { cut: { s: 3, r: '10-12', t: 75 }, maintain: { s: 3, r: '8-12', t: 90 }, lean_bulk: { s: 4, r: '6-10', t: 120 }, bulk: { s: 5, r: '5-8', t: 180 } } },
  { name: 'Fentes', cat: 'Jambes', type: 'strength', muscles: 'Quadriceps · Fessiers', tip: 'Grand pas en avant, genou arrière proche du sol, buste droit.', reps: { cut: { s: 3, r: '12-15', t: 60 }, maintain: { s: 3, r: '10-12', t: 75 }, lean_bulk: { s: 3, r: '10-12', t: 90 }, bulk: { s: 4, r: '8-10', t: 90 } } },
  { name: 'Presse à cuisses', cat: 'Jambes', type: 'strength', muscles: 'Quadriceps · Fessiers', tip: 'Pieds à plat, descends lentement, ne verrouille pas les genoux.', reps: { cut: { s: 3, r: '10-15', t: 75 }, maintain: { s: 3, r: '10-12', t: 90 }, lean_bulk: { s: 4, r: '8-12', t: 90 }, bulk: { s: 4, r: '6-10', t: 120 } } },
  { name: 'Soulevé de terre roumain', cat: 'Jambes', type: 'strength', muscles: 'Ischios · Fessiers', tip: 'Jambes légèrement fléchies, descends la barre le long des jambes.', reps: { cut: { s: 3, r: '10-12', t: 75 }, maintain: { s: 3, r: '8-12', t: 90 }, lean_bulk: { s: 4, r: '8-10', t: 90 }, bulk: { s: 4, r: '6-8', t: 120 } } },
  { name: 'Mollets debout', cat: 'Jambes', type: 'strength', muscles: 'Mollets', tip: 'Monte sur la pointe des pieds, contraction max en haut.', reps: { cut: { s: 3, r: '15-20', t: 45 }, maintain: { s: 3, r: '12-20', t: 60 }, lean_bulk: { s: 4, r: '12-15', t: 60 }, bulk: { s: 4, r: '10-15', t: 75 } } },
  { name: 'Planche', cat: 'Gainage', type: 'time', muscles: 'Abdos · Lombaires · Gainage profond', tip: 'Corps en ligne droite. Contracte abdos et fessiers, respire normalement.', reps: { cut: { s: 3, r: '60s', t: 45 }, maintain: { s: 3, r: '45s', t: 60 }, lean_bulk: { s: 3, r: '45-60s', t: 60 }, bulk: { s: 3, r: '60s', t: 60 } } },
  { name: 'Crunchs', cat: 'Gainage', type: 'strength', muscles: 'Grand droit', tip: 'Mains aux tempes, monte les épaules sans tirer sur la nuque.', reps: { cut: { s: 3, r: '15-25', t: 45 }, maintain: { s: 3, r: '12-20', t: 45 }, lean_bulk: { s: 3, r: '12-15', t: 60 }, bulk: { s: 3, r: '10-15', t: 60 } } },
  { name: 'Relevé de jambes', cat: 'Gainage', type: 'strength', muscles: 'Abdos inférieurs', tip: 'Allongé ou suspendu. Monte les jambes tendues ou fléchies.', reps: { cut: { s: 3, r: '12-15', t: 45 }, maintain: { s: 3, r: '10-15', t: 60 }, lean_bulk: { s: 3, r: '10-12', t: 60 }, bulk: { s: 3, r: '8-12', t: 75 } } },
  { name: 'Russian twists', cat: 'Gainage', type: 'strength', muscles: 'Obliques', tip: 'Assis, buste incliné, pieds décollés. Tourne le buste de gauche à droite.', reps: { cut: { s: 3, r: '20-30', t: 45 }, maintain: { s: 3, r: '20', t: 45 }, lean_bulk: { s: 3, r: '15-20', t: 60 }, bulk: { s: 3, r: '15-20', t: 60 } } },
  { name: 'Course à pied', cat: 'Cardio', type: 'cardio', muscles: 'Système cardio · Jambes', tip: 'Échauffe-toi 5 min. Alterne allures pour progresser.', reps: { cut: '30-45 min', maintain: '20-30 min', lean_bulk: '20 min', bulk: '15 min léger' } },
  { name: 'Vélo', cat: 'Cardio', type: 'cardio', muscles: 'Système cardio · Quadriceps', tip: 'Selle bien réglée. Préserve les genoux, idéal en récup.', reps: { cut: '45-60 min', maintain: '30-45 min', lean_bulk: '20-30 min', bulk: '15-20 min' } },
  { name: 'Rameur', cat: 'Cardio', type: 'cardio', muscles: 'Corps entier', tip: 'Pousse avec les jambes d\'abord, puis tire avec le dos. Dos toujours droit.', reps: { cut: '20-30 min', maintain: '15-20 min', lean_bulk: '15 min', bulk: '10-15 min' } },
  { name: 'Corde à sauter', cat: 'Cardio', type: 'cardio', muscles: 'Mollets · Cardio · Coordination', tip: 'Petits sauts, poignets souples.', reps: { cut: '10-20 min', maintain: '10 min', lean_bulk: '8-10 min', bulk: '5-8 min' } },
  { name: 'Natation', cat: 'Cardio', type: 'cardio', muscles: 'Corps entier · Articulations préservées', tip: 'Idéal en récup ou pour soulager les articulations.', reps: { cut: '30-45 min', maintain: '20-30 min', lean_bulk: '20 min', bulk: '15-20 min' } },
  { name: 'Marche', cat: 'Cardio', type: 'cardio', muscles: 'Cardio doux', tip: 'Le NEAT compte énormément. Vise 8-10k pas/jour.', reps: { cut: '45-60 min', maintain: '30 min', lean_bulk: '20-30 min', bulk: '20 min' } },
  { name: 'HIIT', cat: 'Cardio', type: 'cardio', muscles: 'Cardio intense · Brûle-graisse', tip: 'Alterne 30s effort max / 30s récup.', reps: { cut: '15-20 min', maintain: '12-15 min', lean_bulk: '10 min', bulk: 'Éviter ou 8 min max' } },
];

const FOODS = [
  { name: 'Blanc de poulet cuit', cat: 'Protéines', portion: '100g', kcal: 165, p: 31, c: 0, f: 3.6 },
  { name: 'Cuisse de poulet sans peau', cat: 'Protéines', portion: '100g', kcal: 185, p: 26, c: 0, f: 9 },
  { name: 'Escalope de dinde', cat: 'Protéines', portion: '100g', kcal: 135, p: 30, c: 0, f: 1.5 },
  { name: 'Jambon blanc', cat: 'Protéines', portion: '1 tranche (40g)', kcal: 45, p: 8, c: 0.5, f: 1.5 },
  { name: 'Bœuf haché 5%', cat: 'Protéines', portion: '100g', kcal: 130, p: 21, c: 0, f: 5 },
  { name: 'Bœuf haché 15%', cat: 'Protéines', portion: '100g', kcal: 220, p: 20, c: 0, f: 15 },
  { name: 'Steak de bœuf', cat: 'Protéines', portion: '100g', kcal: 200, p: 26, c: 0, f: 10 },
  { name: 'Saumon', cat: 'Protéines', portion: '100g', kcal: 208, p: 20, c: 0, f: 13 },
  { name: 'Thon frais', cat: 'Protéines', portion: '100g', kcal: 144, p: 30, c: 0, f: 1 },
  { name: 'Thon en conserve au naturel', cat: 'Protéines', portion: '1 boîte (140g)', kcal: 160, p: 35, c: 0, f: 2 },
  { name: 'Cabillaud', cat: 'Protéines', portion: '100g', kcal: 82, p: 18, c: 0, f: 0.7 },
  { name: 'Crevettes', cat: 'Protéines', portion: '100g', kcal: 90, p: 19, c: 0.5, f: 1.5 },
  { name: 'Sardines à l\'huile', cat: 'Protéines', portion: '1 boîte (115g)', kcal: 220, p: 25, c: 0, f: 13 },
  { name: 'Œuf entier', cat: 'Protéines', portion: '1 œuf (60g)', kcal: 78, p: 6, c: 0.6, f: 5 },
  { name: 'Blanc d\'œuf', cat: 'Protéines', portion: '1 blanc (30g)', kcal: 17, p: 3.6, c: 0.2, f: 0.1 },
  { name: 'Tofu nature', cat: 'Protéines', portion: '100g', kcal: 145, p: 15, c: 2, f: 9 },
  { name: 'Tempeh', cat: 'Protéines', portion: '100g', kcal: 195, p: 19, c: 9, f: 11 },
  { name: 'Seitan', cat: 'Protéines', portion: '100g', kcal: 120, p: 25, c: 4, f: 2 },
  { name: 'Riz blanc cuit', cat: 'Féculents', portion: '100g', kcal: 130, p: 2.7, c: 28, f: 0.3 },
  { name: 'Riz complet cuit', cat: 'Féculents', portion: '100g', kcal: 112, p: 2.6, c: 23, f: 0.9 },
  { name: 'Riz basmati cuit', cat: 'Féculents', portion: '100g', kcal: 121, p: 3, c: 25, f: 0.4 },
  { name: 'Pâtes cuites', cat: 'Féculents', portion: '100g', kcal: 131, p: 5, c: 25, f: 1.1 },
  { name: 'Pâtes complètes cuites', cat: 'Féculents', portion: '100g', kcal: 124, p: 5, c: 26, f: 0.6 },
  { name: 'Quinoa cuit', cat: 'Féculents', portion: '100g', kcal: 120, p: 4.4, c: 21, f: 1.9 },
  { name: 'Patate douce cuite', cat: 'Féculents', portion: '100g', kcal: 86, p: 1.6, c: 20, f: 0.1 },
  { name: 'Pomme de terre cuite', cat: 'Féculents', portion: '100g', kcal: 87, p: 1.9, c: 20, f: 0.1 },
  { name: 'Pain blanc', cat: 'Féculents', portion: '1 tranche (30g)', kcal: 80, p: 2.5, c: 15, f: 0.6 },
  { name: 'Pain complet', cat: 'Féculents', portion: '1 tranche (30g)', kcal: 75, p: 3, c: 13, f: 1 },
  { name: 'Pain de mie', cat: 'Féculents', portion: '1 tranche (25g)', kcal: 70, p: 2.3, c: 13, f: 1 },
  { name: 'Semoule cuite', cat: 'Féculents', portion: '100g', kcal: 112, p: 4, c: 23, f: 0.2 },
  { name: 'Boulgour cuit', cat: 'Féculents', portion: '100g', kcal: 83, p: 3, c: 19, f: 0.2 },
  { name: 'Avoine (flocons)', cat: 'Féculents', portion: '40g', kcal: 152, p: 5.5, c: 27, f: 2.7 },
  { name: 'Granola', cat: 'Féculents', portion: '40g', kcal: 180, p: 4, c: 25, f: 7 },
  { name: 'Brocoli', cat: 'Légumes', portion: '100g', kcal: 34, p: 2.8, c: 7, f: 0.4 },
  { name: 'Haricots verts', cat: 'Légumes', portion: '100g', kcal: 31, p: 1.8, c: 7, f: 0.2 },
  { name: 'Courgette', cat: 'Légumes', portion: '100g', kcal: 17, p: 1.2, c: 3, f: 0.3 },
  { name: 'Épinards', cat: 'Légumes', portion: '100g', kcal: 23, p: 2.9, c: 3.6, f: 0.4 },
  { name: 'Salade verte', cat: 'Légumes', portion: '100g', kcal: 15, p: 1.4, c: 3, f: 0.2 },
  { name: 'Tomate', cat: 'Légumes', portion: '1 (120g)', kcal: 22, p: 1, c: 5, f: 0.2 },
  { name: 'Concombre', cat: 'Légumes', portion: '100g', kcal: 16, p: 0.7, c: 3.6, f: 0.1 },
  { name: 'Carotte', cat: 'Légumes', portion: '100g', kcal: 41, p: 0.9, c: 10, f: 0.2 },
  { name: 'Poivron', cat: 'Légumes', portion: '100g', kcal: 31, p: 1, c: 6, f: 0.3 },
  { name: 'Chou-fleur', cat: 'Légumes', portion: '100g', kcal: 25, p: 1.9, c: 5, f: 0.3 },
  { name: 'Champignons', cat: 'Légumes', portion: '100g', kcal: 22, p: 3.1, c: 3.3, f: 0.3 },
  { name: 'Aubergine', cat: 'Légumes', portion: '100g', kcal: 25, p: 1, c: 6, f: 0.2 },
  { name: 'Banane', cat: 'Fruits', portion: '1 (120g)', kcal: 105, p: 1.3, c: 27, f: 0.4 },
  { name: 'Pomme', cat: 'Fruits', portion: '1 (180g)', kcal: 95, p: 0.5, c: 25, f: 0.3 },
  { name: 'Orange', cat: 'Fruits', portion: '1 (150g)', kcal: 70, p: 1.4, c: 17, f: 0.2 },
  { name: 'Fraises', cat: 'Fruits', portion: '100g', kcal: 32, p: 0.7, c: 8, f: 0.3 },
  { name: 'Myrtilles', cat: 'Fruits', portion: '100g', kcal: 57, p: 0.7, c: 14, f: 0.3 },
  { name: 'Ananas', cat: 'Fruits', portion: '100g', kcal: 50, p: 0.5, c: 13, f: 0.1 },
  { name: 'Mangue', cat: 'Fruits', portion: '100g', kcal: 60, p: 0.8, c: 15, f: 0.4 },
  { name: 'Raisin', cat: 'Fruits', portion: '100g', kcal: 70, p: 0.7, c: 18, f: 0.2 },
  { name: 'Kiwi', cat: 'Fruits', portion: '1 (75g)', kcal: 45, p: 0.9, c: 10, f: 0.4 },
  { name: 'Avocat', cat: 'Fruits', portion: '1/2 (100g)', kcal: 160, p: 2, c: 9, f: 15 },
  { name: 'Yaourt nature', cat: 'Laitiers', portion: '125g', kcal: 75, p: 5, c: 7, f: 3 },
  { name: 'Yaourt grec 0%', cat: 'Laitiers', portion: '150g', kcal: 90, p: 15, c: 6, f: 0 },
  { name: 'Skyr', cat: 'Laitiers', portion: '150g', kcal: 90, p: 17, c: 5, f: 0 },
  { name: 'Fromage blanc 0%', cat: 'Laitiers', portion: '100g', kcal: 50, p: 8, c: 4, f: 0.2 },
  { name: 'Fromage blanc 20%', cat: 'Laitiers', portion: '100g', kcal: 85, p: 7.5, c: 4, f: 3.5 },
  { name: 'Cottage cheese', cat: 'Laitiers', portion: '100g', kcal: 98, p: 11, c: 3.4, f: 4.3 },
  { name: 'Mozzarella', cat: 'Laitiers', portion: '30g', kcal: 75, p: 6, c: 0.6, f: 5.5 },
  { name: 'Comté', cat: 'Laitiers', portion: '30g', kcal: 120, p: 8, c: 0, f: 10 },
  { name: 'Lait demi-écrémé', cat: 'Laitiers', portion: '250ml', kcal: 115, p: 8, c: 12, f: 4 },
  { name: 'Lait d\'amande non sucré', cat: 'Laitiers', portion: '250ml', kcal: 30, p: 1, c: 0.5, f: 2.5 },
  { name: 'Huile d\'olive', cat: 'Lipides', portion: '1 c.à.s (10g)', kcal: 90, p: 0, c: 0, f: 10 },
  { name: 'Huile de colza', cat: 'Lipides', portion: '1 c.à.s (10g)', kcal: 90, p: 0, c: 0, f: 10 },
  { name: 'Beurre', cat: 'Lipides', portion: '10g', kcal: 75, p: 0.1, c: 0.1, f: 8.2 },
  { name: 'Amandes', cat: 'Lipides', portion: '30g', kcal: 174, p: 6, c: 6, f: 15 },
  { name: 'Noix', cat: 'Lipides', portion: '30g', kcal: 195, p: 4.5, c: 4, f: 19 },
  { name: 'Noisettes', cat: 'Lipides', portion: '30g', kcal: 188, p: 4.5, c: 5, f: 18 },
  { name: 'Cacahuètes', cat: 'Lipides', portion: '30g', kcal: 170, p: 7.7, c: 5, f: 14 },
  { name: 'Beurre de cacahuète', cat: 'Lipides', portion: '1 c.à.s (15g)', kcal: 95, p: 4, c: 3, f: 8 },
  { name: 'Graines de chia', cat: 'Lipides', portion: '15g', kcal: 73, p: 2.5, c: 6, f: 4.6 },
  { name: 'Lentilles cuites', cat: 'Légumineuses', portion: '100g', kcal: 116, p: 9, c: 20, f: 0.4 },
  { name: 'Pois chiches cuits', cat: 'Légumineuses', portion: '100g', kcal: 164, p: 9, c: 27, f: 2.6 },
  { name: 'Haricots rouges cuits', cat: 'Légumineuses', portion: '100g', kcal: 127, p: 9, c: 23, f: 0.5 },
  { name: 'Haricots blancs cuits', cat: 'Légumineuses', portion: '100g', kcal: 139, p: 9.7, c: 25, f: 0.3 },
  { name: 'Edamame', cat: 'Légumineuses', portion: '100g', kcal: 121, p: 12, c: 9, f: 5 },
  { name: 'Whey protéine', cat: 'Snacks', portion: '30g', kcal: 120, p: 24, c: 2, f: 1.5 },
  { name: 'Barre protéinée', cat: 'Snacks', portion: '1 (60g)', kcal: 220, p: 20, c: 22, f: 7 },
  { name: 'Chocolat noir 70%', cat: 'Snacks', portion: '20g', kcal: 110, p: 1.6, c: 9, f: 8 },
  { name: 'Hummus', cat: 'Snacks', portion: '30g', kcal: 50, p: 2, c: 3, f: 3.5 },
  { name: 'Miel', cat: 'Snacks', portion: '1 c.à.s (15g)', kcal: 45, p: 0, c: 12, f: 0 },
  { name: 'Galette de riz', cat: 'Snacks', portion: '1 (10g)', kcal: 35, p: 1, c: 7, f: 0.3 },
  { name: 'Café noir', cat: 'Boissons', portion: '1 tasse', kcal: 2, p: 0.3, c: 0, f: 0 },
  { name: 'Thé', cat: 'Boissons', portion: '1 tasse', kcal: 2, p: 0, c: 0, f: 0 },
  { name: 'Jus d\'orange pressé', cat: 'Boissons', portion: '200ml', kcal: 90, p: 1.5, c: 21, f: 0.2 },
  { name: 'Soda zéro', cat: 'Boissons', portion: '330ml', kcal: 1, p: 0, c: 0, f: 0 },
];

const RECIPES = [
  { name: 'Porridge avoine fruits rouges', moment: 'breakfast', goals: ['cut','maintain','lean_bulk','bulk'], kcal: 380, p: 18, c: 55, f: 9, desc: '50g flocons avoine + 250ml lait + 100g fruits rouges + 1 c.s miel + 15g amandes' },
  { name: 'Omelette 3 œufs + pain complet', moment: 'breakfast', goals: ['cut','maintain','lean_bulk'], kcal: 380, p: 25, c: 26, f: 18, desc: '3 œufs + 2 tranches pain complet + tomate + herbes' },
  { name: 'Pancakes protéinés banane', moment: 'breakfast', goals: ['lean_bulk','bulk','maintain'], kcal: 450, p: 30, c: 50, f: 11, desc: '40g avoine + 30g whey + 1 banane + 2 blancs + 1 œuf, à la poêle' },
  { name: 'Tartine avocat œuf', moment: 'breakfast', goals: ['cut','maintain','lean_bulk'], kcal: 350, p: 16, c: 28, f: 19, desc: '2 tr. pain complet + 1/2 avocat + 2 œufs au plat + paprika' },
  { name: 'Bowl skyr granola fruits', moment: 'breakfast', goals: ['cut','maintain','lean_bulk'], kcal: 320, p: 22, c: 42, f: 6, desc: '150g skyr + 30g granola + 100g fruits rouges + 1 c.s miel' },
  { name: 'Smoothie banane peanut whey', moment: 'breakfast', goals: ['bulk','lean_bulk'], kcal: 550, p: 35, c: 55, f: 17, desc: '1 banane + 30g whey + 1 c.s beurre cacahuète + 50g avoine + 250ml lait' },
  { name: 'Bowl poulet riz brocoli', moment: 'lunch', goals: ['cut','maintain','lean_bulk'], kcal: 490, p: 45, c: 50, f: 8, desc: '130g poulet + 100g riz cuit + 200g brocoli + 1 c.s huile olive' },
  { name: 'Saumon patate douce épinards', moment: 'lunch', goals: ['maintain','lean_bulk','bulk'], kcal: 580, p: 35, c: 48, f: 24, desc: '150g saumon + 200g patate douce + épinards à l\'ail' },
  { name: 'Pâtes complètes bolognaise', moment: 'lunch', goals: ['lean_bulk','bulk','maintain'], kcal: 620, p: 35, c: 80, f: 14, desc: '100g pâtes complètes (cru) + 150g bœuf haché 5% + sauce tomate + parmesan' },
  { name: 'Salade thon œuf quinoa', moment: 'lunch', goals: ['cut','maintain'], kcal: 430, p: 38, c: 35, f: 12, desc: '1 boîte thon + 100g quinoa cuit + 2 œufs durs + crudités + vinaigrette légère' },
  { name: 'Wrap poulet crudités', moment: 'lunch', goals: ['cut','maintain','lean_bulk'], kcal: 460, p: 35, c: 45, f: 12, desc: '1 wrap complet + 120g poulet + salade + tomate + sauce yaourt' },
  { name: 'Steak frites maison salade', moment: 'lunch', goals: ['lean_bulk','bulk'], kcal: 650, p: 40, c: 55, f: 25, desc: '150g steak + 250g pommes de terre four + salade + huile olive' },
  { name: 'Poulet curry riz basmati', moment: 'lunch', goals: ['maintain','lean_bulk','bulk'], kcal: 580, p: 42, c: 60, f: 14, desc: '150g poulet + 120g riz basmati cuit + sauce curry coco light + légumes' },
  { name: 'Buddha bowl tofu', moment: 'lunch', goals: ['cut','maintain'], kcal: 480, p: 22, c: 55, f: 18, desc: '100g tofu + 100g quinoa + avocat + chou rouge + carotte + sauce tahini' },
  { name: 'Cabillaud légumes vapeur', moment: 'dinner', goals: ['cut','maintain'], kcal: 320, p: 35, c: 25, f: 8, desc: '150g cabillaud + brocoli + courgette + 100g riz + filet huile olive' },
  { name: 'Omelette légumes salade', moment: 'dinner', goals: ['cut','maintain'], kcal: 350, p: 22, c: 12, f: 23, desc: '3 œufs + champignons + épinards + tomate + salade vinaigrette' },
  { name: 'Soupe légumes + poulet', moment: 'dinner', goals: ['cut','maintain'], kcal: 380, p: 32, c: 28, f: 10, desc: 'Bouillon avec carotte, poireau, courgette + 120g poulet effiloché' },
  { name: 'Curry de pois chiches riz', moment: 'dinner', goals: ['lean_bulk','bulk','maintain'], kcal: 550, p: 22, c: 80, f: 12, desc: '200g pois chiches + 120g riz cuit + tomate + curry + coriandre' },
  { name: 'Pavé saumon quinoa courgettes', moment: 'dinner', goals: ['maintain','lean_bulk'], kcal: 520, p: 34, c: 40, f: 22, desc: '130g saumon + 100g quinoa + courgettes grillées + citron' },
  { name: 'Dahl lentilles corail', moment: 'dinner', goals: ['cut','maintain','lean_bulk'], kcal: 420, p: 22, c: 60, f: 9, desc: '100g lentilles corail + lait coco light + tomate + épices + riz basmati' },
  { name: 'Yaourt grec + amandes', moment: 'snack', goals: ['cut','maintain','lean_bulk'], kcal: 240, p: 17, c: 10, f: 15, desc: '150g yaourt grec 0% + 30g amandes + miel' },
  { name: 'Fromage blanc fruits rouges', moment: 'snack', goals: ['cut','maintain','lean_bulk'], kcal: 150, p: 14, c: 18, f: 0.5, desc: '200g fromage blanc 0% + 100g fruits rouges' },
  { name: 'Pomme + beurre cacahuète', moment: 'snack', goals: ['maintain','lean_bulk','bulk'], kcal: 190, p: 4, c: 28, f: 8, desc: '1 pomme + 1 c.s beurre cacahuète' },
  { name: 'Shake protéiné post-séance', moment: 'snack', goals: ['cut','maintain','lean_bulk','bulk'], kcal: 150, p: 24, c: 5, f: 2, desc: '30g whey + 250ml lait amande + banane si besoin de glucides' },
  { name: 'Galettes riz + thon', moment: 'snack', goals: ['cut','maintain','lean_bulk'], kcal: 220, p: 28, c: 18, f: 5, desc: '2 galettes riz + 1 boîte thon + concombre + citron' },
  { name: 'Carottes + hummus', moment: 'snack', goals: ['cut','maintain'], kcal: 130, p: 4, c: 15, f: 6, desc: '150g bâtonnets de carotte + 60g hummus' },
];

const MEAL_MOMENTS = [
  { id: 'breakfast', label: 'Petit-déjeuner', icon: '☕' },
  { id: 'lunch', label: 'Déjeuner', icon: '🥗' },
  { id: 'dinner', label: 'Dîner', icon: '🍽️' },
  { id: 'snack', label: 'Collation', icon: '🥜' },
];

const WORKOUT_TEMPLATES = {
  cut: [
    { name: 'Full Body A', desc: 'Force globale - jour 1', exercises: ['Squat','Développé couché','Tractions','Planche','Russian twists'] },
    { name: 'Full Body B', desc: 'Force globale - jour 2', exercises: ['Soulevé de terre','Développé militaire','Rowing barre','Fentes','Crunchs'] },
    { name: 'HIIT brûle-graisse', desc: 'Cardio haute intensité', exercises: ['HIIT','Corde à sauter','Planche'] },
    { name: 'Circuit conditionnement', desc: 'Cardio + force', exercises: ['Pompes','Squat','Tractions','HIIT','Planche'] },
  ],
  maintain: [
    { name: 'Haut du corps', desc: 'Push + pull', exercises: ['Développé couché','Tractions','Développé militaire','Rowing barre','Curl biceps','Extension triceps'] },
    { name: 'Bas du corps', desc: 'Jambes + gainage', exercises: ['Squat','Soulevé de terre roumain','Fentes','Mollets debout','Planche'] },
    { name: 'Cardio modéré', desc: 'Endurance', exercises: ['Course à pied','Vélo'] },
  ],
  lean_bulk: [
    { name: 'Push (poussée)', desc: 'Pecs · Épaules · Triceps', exercises: ['Développé couché','Développé militaire','Développé incliné haltères','Dips','Élévations latérales','Extension triceps'] },
    { name: 'Pull (tirage)', desc: 'Dos · Biceps', exercises: ['Tractions','Rowing barre','Tirage poulie haute','Rowing haltère','Curl biceps','Curl marteau'] },
    { name: 'Legs (jambes)', desc: 'Quadriceps · Fessiers · Ischios', exercises: ['Squat','Soulevé de terre roumain','Presse à cuisses','Fentes','Mollets debout','Planche'] },
    { name: 'Full Body léger', desc: 'Récupération active', exercises: ['Squat','Pompes','Rowing haltère','Planche'] },
  ],
  bulk: [
    { name: 'Force - Squat', desc: 'Jambes lourdes', exercises: ['Squat','Soulevé de terre roumain','Presse à cuisses','Mollets debout'] },
    { name: 'Force - Bench', desc: 'Pecs lourds', exercises: ['Développé couché','Développé incliné haltères','Dips','Extension triceps'] },
    { name: 'Force - Deadlift', desc: 'Dos lourd', exercises: ['Soulevé de terre','Rowing barre','Tractions','Curl biceps'] },
    { name: 'Force - Overhead', desc: 'Épaules lourdes', exercises: ['Développé militaire','Élévations latérales','Oiseau','Barre au front'] },
  ],
};

const COACH_TIPS = {
  cut: [
    '🎯 Vise un déficit de 300-500 kcal max : trop agressif = perte de muscle et rebond.',
    '🍗 Garde tes protéines hautes (2-2.5g/kg) pour préserver ta masse musculaire.',
    '💧 Bois 2.5-3L d\'eau/jour. La faim est souvent confondue avec la soif.',
    '⚡ Place tes glucides autour de tes entraînements pour avoir l\'énergie.',
    '🛌 Dors 7-9h. Mauvaise récup = stress = stockage du gras et fringales.',
    '🥗 Privilégie les aliments à fort volume mais peu caloriques.',
    '🚶 Marche 8-10k pas/jour : le NEAT compte énormément en sèche.',
    '🍫 Tu peux avoir une fenêtre flexible 1-2 fois/sem si tu restes en moyenne en déficit.',
    '⚖️ Pèse-toi le matin à jeun, 1-2 fois/semaine, et regarde la moyenne.',
    '💪 Continue la musculation lourde : c\'est ce qui dit à ton corps de garder le muscle.',
  ],
  maintain: [
    '⚖️ Maintien = trouve ton TDEE réel : ajuste ±100 kcal selon ton poids hebdomadaire.',
    '🍗 1.6-2g/kg de protéines reste idéal même hors prise/sèche.',
    '🌈 Varie ton alimentation : différents fruits, légumes, sources de protéines.',
    '💧 1.5-2L d\'eau par jour minimum, plus si tu transpires.',
    '🏃 Mix idéal : 3 séances force + 1-2 cardio par semaine.',
    '🛌 La récupération est aussi importante que l\'entraînement.',
    '📈 Cherche la progression : 1-2 reps de plus ou 1kg de plus chaque semaine.',
    '🥑 Inclus de bons gras chaque jour : avocat, huile olive, oléagineux, poisson gras.',
  ],
  lean_bulk: [
    '🎯 Surplus léger : 200-300 kcal. Trop = trop de gras à perdre ensuite.',
    '🍚 Augmente surtout tes glucides : ils alimentent les performances et la prise musculaire.',
    '🍗 2g/kg de protéines suffisent. Inutile d\'aller au-delà.',
    '🏋️ Surcharge progressive : ajoute du poids ou des reps chaque semaine.',
    '⏰ Mange un repas riche en glucides + protéines 1-2h avant la séance.',
    '🥛 Post-training : 20-30g de protéines + glucides rapides dans l\'heure.',
    '⚖️ Vise +0.25 à 0.5 kg/semaine. Plus = surtout du gras.',
    '🛌 Dors 8h : c\'est pendant le sommeil que le muscle se construit.',
    '💧 3L d\'eau/jour si tu manges beaucoup : la digestion en demande plus.',
    '🥗 N\'oublie pas tes légumes : fibres + micronutriments = meilleure assimilation.',
  ],
  bulk: [
    '🎯 Surplus marqué : 400-600 kcal pour maximiser la prise de poids.',
    '🍚 Les glucides sont ton meilleur ami : riz, pâtes, avoine, pain.',
    '🏋️ Priorité aux mouvements lourds polyarticulaires : squat, soulevé, développé.',
    '🍗 2g/kg de protéines, pas besoin de plus.',
    '🥑 Les gras montent les calories facilement : huile olive, oléagineux, beurres.',
    '📈 Cherche des PRs (records personnels) toutes les 1-2 semaines.',
    '🛌 8-9h de sommeil obligatoires en phase de prise lourde.',
    '⚖️ Vise 0.5-1 kg/semaine. Au-delà = trop de gras.',
    '🥤 Si tu galères à manger assez, fais des shakes : whey + lait + banane + beurre cacahuète.',
    '🧘 Repos = construction. Limite le cardio long, prends 1-2 jours off/semaine.',
  ],
};

const HYDRATION_GOAL_ML = { M: 2500, F: 2000 };
const GLASS_ML = 250;

// ============================================
// UTILITAIRES
// ============================================
const todayStr = () => new Date().toISOString().split('T')[0];
const formatDateFR = (d) => new Date(d).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
const shiftDate = (d, days) => { const dt = new Date(d); dt.setDate(dt.getDate() + days); return dt.toISOString().split('T')[0]; };

const computeGoals = ({ sex, age, height, weight, activity, goal }) => {
  const w = Number(weight), h = Number(height), a = Number(age);
  if (!w || !h || !a) return { kcal: 2000, p: 120, bmr: 0, tdee: 0 };
  const bmrBase = 10 * w + 6.25 * h - 5 * a;
  const bmr = sex === 'M' ? bmrBase + 5 : bmrBase - 161;
  const actObj = ACTIVITY_LEVELS.find(x => x.id === activity) || ACTIVITY_LEVELS[2];
  const tdee = bmr * actObj.mult;
  const goalObj = GOALS.find(x => x.id === goal) || GOALS[1];
  const kcal = Math.round(tdee + goalObj.adjust);
  const p = Math.round(w * goalObj.proteinPerKg);
  return { kcal, p, bmr: Math.round(bmr), tdee: Math.round(tdee) };
};

const computeMacros = (goalId, kcal, protein) => {
  const goal = GOALS.find(g => g.id === goalId) || GOALS[1];
  const fatG = Math.round((kcal * goal.macroSplit.f / 100) / 9);
  const carbG = Math.round((kcal - protein * 4 - fatG * 9) / 4);
  return { p: protein, c: Math.max(0, carbG), f: fatG };
};

const getDailyTip = (goalId) => {
  const tips = COACH_TIPS[goalId] || COACH_TIPS.maintain;
  const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
  return tips[dayOfYear % tips.length];
};

// ============================================
// APP
// ============================================
export default function App() {
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [date, setDate] = useState(todayStr());
  const [dayData, setDayData] = useState({ meals: [], workouts: [], water: 0 });
  const [tab, setTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await storage.get('users');
        if (res?.value) setUsers(JSON.parse(res.value));
      } catch {}
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    (async () => {
      const key = `data:${currentUser.id}:${date}`;
      try {
        const res = await storage.get(key);
        if (res?.value) {
          const d = JSON.parse(res.value);
          setDayData({ meals: d.meals || [], workouts: d.workouts || [], water: d.water || 0 });
        } else {
          setDayData({ meals: [], workouts: [], water: 0 });
        }
      } catch { setDayData({ meals: [], workouts: [], water: 0 }); }
    })();
  }, [currentUser, date]);

  const saveDay = async (newData) => {
    setDayData(newData);
    if (!currentUser) return;
    try { await storage.set(`data:${currentUser.id}:${date}`, JSON.stringify(newData)); } catch (e) { console.error(e); }
  };

  const saveUsers = async (newUsers) => {
    setUsers(newUsers);
    try { await storage.set('users', JSON.stringify(newUsers)); } catch (e) { console.error(e); }
  };

  const totals = useMemo(() => {
    const t = { kcal: 0, p: 0, c: 0, f: 0 };
    dayData.meals?.forEach(m => { t.kcal += m.kcal || 0; t.p += m.p || 0; t.c += m.c || 0; t.f += m.f || 0; });
    return t;
  }, [dayData.meals]);

  if (loading) {
    return (
      <div style={styles.app}>
        <FontImport />
        <div style={{ ...styles.center, height: '100vh' }}>
          <div style={{ color: '#d4ff3a', fontFamily: 'Fraunces, serif', fontSize: 32, letterSpacing: -1 }}>chargement…</div>
        </div>
      </div>
    );
  }

  if (!currentUser) return <ProfileSelector users={users} onSelect={setCurrentUser} onSave={saveUsers} />;

  return (
    <div style={styles.app}>
      <FontImport />
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <div>
            <div style={styles.brand}>FIT<span style={{ color: currentUser.color }}>·</span>NUTRI</div>
            <div style={styles.userBadge}>
              <span style={{ ...styles.userDot, background: currentUser.color }} />
              {currentUser.name}
              {currentUser.goal && <span style={{ marginLeft: 8, opacity: 0.7 }}>· {GOALS.find(g => g.id === currentUser.goal)?.label}</span>}
            </div>
          </div>
          <button onClick={() => setCurrentUser(null)} style={styles.iconBtn}><LogOut size={18} /></button>
        </div>
        <div style={styles.dateBar}>
          <button onClick={() => setDate(shiftDate(date, -1))} style={styles.dateBtn}><ChevronLeft size={16} /></button>
          <div style={styles.dateLabel}>{date === todayStr() ? "Aujourd'hui" : formatDateFR(date)}</div>
          <button onClick={() => setDate(shiftDate(date, 1))} style={{ ...styles.dateBtn, opacity: date >= todayStr() ? 0.3 : 1 }} disabled={date >= todayStr()}><ChevronRight size={16} /></button>
        </div>
      </header>

      <main>
        {tab === 'dashboard' && <Dashboard totals={totals} dayData={dayData} user={currentUser}
          onUpdateUser={async (u) => { const nu = users.map(x => x.id === u.id ? u : x); await saveUsers(nu); setCurrentUser(u); }}
          onUpdateWater={(w) => saveDay({ ...dayData, water: w })} />}
        {tab === 'nutrition' && <Nutrition meals={dayData.meals || []} onUpdate={(m) => saveDay({ ...dayData, meals: m })} user={currentUser} />}
        {tab === 'sport' && <Sport workouts={dayData.workouts || []} onUpdate={(w) => saveDay({ ...dayData, workouts: w })} user={currentUser} />}
        {tab === 'history' && <HistoryView user={currentUser} />}
      </main>

      <nav style={styles.nav}>
        <NavBtn icon={<Home size={20} />} label="Accueil" active={tab === 'dashboard'} onClick={() => setTab('dashboard')} color={currentUser.color} />
        <NavBtn icon={<Apple size={20} />} label="Nutrition" active={tab === 'nutrition'} onClick={() => setTab('nutrition')} color={currentUser.color} />
        <NavBtn icon={<Dumbbell size={20} />} label="Sport" active={tab === 'sport'} onClick={() => setTab('sport')} color={currentUser.color} />
        <NavBtn icon={<History size={20} />} label="Historique" active={tab === 'history'} onClick={() => setTab('history')} color={currentUser.color} />
      </nav>
    </div>
  );
}

// ============================================
// PROFIL
// ============================================
function ProfileSelector({ users, onSelect, onSave }) {
  const [mode, setMode] = useState(users.length === 0 ? 'choice' : 'list');
  const handleCreate = async (profile) => {
    const newUser = { id: Date.now().toString(), ...profile };
    await onSave([...users, newUser]); onSelect(newUser);
  };
  const removeUser = async (id) => { if (window.confirm('Supprimer ce profil ?')) await onSave(users.filter(u => u.id !== id)); };

  if (mode === 'guided') return <GuidedSetup onSave={handleCreate} onBack={() => setMode(users.length === 0 ? 'choice' : 'list')} />;
  if (mode === 'manual') return <ManualSetup onSave={handleCreate} onBack={() => setMode(users.length === 0 ? 'choice' : 'list')} />;
  if (mode === 'choice') return <ChoiceScreen onGuided={() => setMode('guided')} onManual={() => setMode('manual')} onBack={users.length > 0 ? () => setMode('list') : null} />;

  return (
    <div style={styles.app}>
      <FontImport />
      <div style={styles.setupWrap}>
        <div style={styles.setupHero}>
          <div style={styles.setupKicker}>SPORT · NUTRITION · COACH</div>
          <h1 style={styles.setupTitle}>Fit<span style={{ color: '#d4ff3a' }}>·</span>Nutri</h1>
          <p style={styles.setupLede}>Ton coach perso pour suivre tes entraînements, ta nutrition, et atteindre tes objectifs.</p>
        </div>

        <div style={{ marginBottom: 24 }}>
          <div style={styles.sectionLabel}>Choisir un profil</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {users.map(u => (
              <div key={u.id} style={styles.profileCard}>
                <button onClick={() => onSelect(u)} style={styles.profileBtn}>
                  <span style={{ ...styles.profileDot, background: u.color }} />
                  <div style={{ flex: 1, textAlign: 'left' }}>
                    <div style={styles.profileName}>{u.name}</div>
                    {u.goal && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>{GOALS.find(g => g.id === u.goal)?.label} · {u.goals?.kcal} kcal · {u.goals?.p}g P</div>}
                  </div>
                  <ChevronRight size={18} style={{ opacity: 0.5 }} />
                </button>
                <button onClick={() => removeUser(u.id)} style={styles.profileRemove}><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
        </div>

        <button onClick={() => setMode('choice')} style={styles.addProfileBtn}><UserPlus size={18} /> Ajouter un profil</button>
        <div style={styles.footerNote}>Données sauvegardées sur ton téléphone (localStorage).</div>
      </div>
    </div>
  );
}

function ChoiceScreen({ onGuided, onManual, onBack }) {
  return (
    <div style={styles.app}>
      <FontImport />
      <div style={styles.setupWrap}>
        {onBack && <button onClick={onBack} style={styles.backBtn}><ArrowLeft size={16} /> Retour</button>}
        <div style={styles.setupHero}>
          <div style={styles.setupKicker}>NOUVEAU PROFIL</div>
          <h1 style={{ ...styles.setupTitle, fontSize: 44 }}>Comment veux-tu<br />démarrer ?</h1>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <button onClick={onGuided} style={styles.choiceCard}>
            <div style={{ ...styles.choiceIcon, background: '#d4ff3a', color: '#0a0a0a' }}><Sparkles size={22} /></div>
            <div style={{ flex: 1, textAlign: 'left' }}>
              <div style={styles.choiceTitle}>Création guidée</div>
              <div style={styles.choiceDesc}>Réponds à quelques questions, on calcule tes besoins et on te propose un programme adapté.</div>
            </div>
            <ChevronRight size={20} style={{ opacity: 0.5 }} />
          </button>
          <button onClick={onManual} style={styles.choiceCard}>
            <div style={{ ...styles.choiceIcon, background: 'rgba(255,255,255,0.08)' }}><Edit3 size={22} /></div>
            <div style={{ flex: 1, textAlign: 'left' }}>
              <div style={styles.choiceTitle}>Création manuelle</div>
              <div style={styles.choiceDesc}>Tu connais déjà tes chiffres. Saisis-les directement.</div>
            </div>
            <ChevronRight size={20} style={{ opacity: 0.5 }} />
          </button>
        </div>
      </div>
    </div>
  );
}

function ManualSetup({ onSave, onBack }) {
  const [name, setName] = useState(''); const [color, setColor] = useState(PROFILE_COLORS[0]);
  const [kcal, setKcal] = useState(2000); const [p, setP] = useState(120);
  const [weight, setWeight] = useState(''); const [targetWeight, setTargetWeight] = useState('');
  const [goal, setGoal] = useState('maintain');

  const submit = () => {
    if (!name.trim()) return;
    onSave({ name: name.trim(), color, mode: 'manual', goal,
      weight: Number(weight) || null, targetWeight: Number(targetWeight) || null,
      goals: { kcal: Number(kcal) || 2000, p: Number(p) || 120 } });
  };

  return (
    <div style={styles.app}>
      <FontImport />
      <div style={styles.setupWrap}>
        <button onClick={onBack} style={styles.backBtn}><ArrowLeft size={16} /> Retour</button>
        <div style={styles.setupHero}>
          <div style={styles.setupKicker}>MANUEL</div>
          <h1 style={{ ...styles.setupTitle, fontSize: 48 }}>À toi de jouer</h1>
        </div>
        <div style={styles.formCard}>
          <div style={styles.fieldLabel}>Prénom</div>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Prénom" style={styles.input} autoFocus />
          <div style={{ ...styles.fieldLabel, marginTop: 16 }}>Couleur</div>
          <ColorPicker color={color} onChange={setColor} />
          <div style={{ ...styles.fieldLabel, marginTop: 16 }}>Objectif (pour les recommandations sport)</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {GOALS.map(g => (
              <button key={g.id} onClick={() => setGoal(g.id)} style={{
                ...styles.toggleBtn, padding: '10px 8px', fontSize: 13,
                background: goal === g.id ? g.accent : 'rgba(255,255,255,0.04)',
                color: goal === g.id ? '#0a0a0a' : '#f5f5f0',
              }}>{g.label}</button>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 16 }}>
            <div><div style={styles.fieldLabel}>Poids actuel (kg)</div><input type="number" value={weight} onChange={e => setWeight(e.target.value)} style={styles.input} placeholder="70" /></div>
            <div><div style={styles.fieldLabel}>Poids cible (kg)</div><input type="number" value={targetWeight} onChange={e => setTargetWeight(e.target.value)} style={styles.input} placeholder="68" /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 16 }}>
            <div><div style={styles.fieldLabel}>Calories / jour</div><input type="number" value={kcal} onChange={e => setKcal(e.target.value)} style={styles.input} /></div>
            <div><div style={styles.fieldLabel}>Protéines (g)</div><input type="number" value={p} onChange={e => setP(e.target.value)} style={styles.input} /></div>
          </div>
          <button onClick={submit} style={{ ...styles.btnPrimary, width: '100%', marginTop: 20 }}><Check size={16} /> Créer le profil</button>
        </div>
      </div>
    </div>
  );
}

function GuidedSetup({ onSave, onBack }) {
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState({ name: '', color: PROFILE_COLORS[0], sex: 'M', age: '', height: '', weight: '', targetWeight: '', activity: 'moderate', goal: 'maintain' });
  const update = (key, value) => setProfile(p => ({ ...p, [key]: value }));
  const computed = useMemo(() => computeGoals(profile), [profile]);

  const canNext = () => {
    if (step === 1) return profile.name.trim().length > 0;
    if (step === 2) return profile.age && profile.height && profile.weight;
    if (step === 3) return profile.goal;
    if (step === 4) return profile.activity;
    return true;
  };

  const finish = () => onSave({
    ...profile,
    age: Number(profile.age), height: Number(profile.height), weight: Number(profile.weight),
    targetWeight: Number(profile.targetWeight) || null, mode: 'guided',
    goals: { kcal: computed.kcal, p: computed.p }, bmr: computed.bmr, tdee: computed.tdee,
  });

  return (
    <div style={styles.app}>
      <FontImport />
      <div style={styles.setupWrap}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <button onClick={() => step === 1 ? onBack() : setStep(step - 1)} style={styles.backBtn}>
            <ArrowLeft size={16} /> {step === 1 ? 'Retour' : 'Précédent'}
          </button>
          <div style={styles.stepIndicator}>
            {[1,2,3,4,5].map(s => <div key={s} style={{ ...styles.stepDot, background: s <= step ? profile.color : 'rgba(255,255,255,0.15)', width: s === step ? 22 : 6 }} />)}
          </div>
        </div>

        {step === 1 && (<>
          <div style={styles.stepHeader}><div style={styles.setupKicker}>ÉTAPE 1 / 5</div><h2 style={styles.stepTitle}>Comment t'appelles-tu ?</h2></div>
          <div style={styles.formCard}>
            <div style={styles.fieldLabel}>Prénom</div>
            <input value={profile.name} onChange={e => update('name', e.target.value)} placeholder="Ton prénom" style={styles.input} autoFocus />
            <div style={{ ...styles.fieldLabel, marginTop: 20 }}>Ta couleur</div>
            <ColorPicker color={profile.color} onChange={c => update('color', c)} />
          </div>
        </>)}

        {step === 2 && (<>
          <div style={styles.stepHeader}>
            <div style={styles.setupKicker}>ÉTAPE 2 / 5</div>
            <h2 style={styles.stepTitle}>Parle-moi de toi</h2>
            <p style={styles.stepSub}>Nécessaire pour calculer tes besoins (formule Mifflin-St Jeor).</p>
          </div>
          <div style={styles.formCard}>
            <div style={styles.fieldLabel}>Sexe</div>
            <div style={{ display: 'flex', gap: 10 }}>
              {[{id:'M',l:'Homme'},{id:'F',l:'Femme'}].map(s => (
                <button key={s.id} onClick={() => update('sex', s.id)} style={{
                  ...styles.toggleBtn,
                  background: profile.sex === s.id ? profile.color : 'rgba(255,255,255,0.04)',
                  color: profile.sex === s.id ? '#0a0a0a' : '#f5f5f0' }}>{s.l}</button>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 16 }}>
              <div><div style={styles.fieldLabel}>Âge</div><input type="number" value={profile.age} onChange={e => update('age', e.target.value)} style={styles.input} placeholder="30" /></div>
              <div><div style={styles.fieldLabel}>Taille (cm)</div><input type="number" value={profile.height} onChange={e => update('height', e.target.value)} style={styles.input} placeholder="175" /></div>
            </div>
            <div style={{ marginTop: 12 }}>
              <div style={styles.fieldLabel}>Poids actuel (kg)</div>
              <input type="number" step="0.1" value={profile.weight} onChange={e => update('weight', e.target.value)} style={styles.input} placeholder="72" />
            </div>
          </div>
        </>)}

        {step === 3 && (<>
          <div style={styles.stepHeader}><div style={styles.setupKicker}>ÉTAPE 3 / 5</div><h2 style={styles.stepTitle}>Quel est ton objectif ?</h2></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {GOALS.map(g => (
              <button key={g.id} onClick={() => update('goal', g.id)} style={{
                ...styles.goalCard,
                borderColor: profile.goal === g.id ? g.accent : 'rgba(255,255,255,0.08)',
                background: profile.goal === g.id ? `${g.accent}10` : 'rgba(255,255,255,0.025)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: g.accent }} />
                  <div style={{ fontFamily: 'Fraunces, serif', fontSize: 22, fontWeight: 600, letterSpacing: -0.5 }}>{g.label}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginLeft: 'auto' }}>{g.adjust > 0 ? '+' : ''}{g.adjust} kcal</div>
                </div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 1.45, textAlign: 'left' }}>{g.desc}</div>
              </button>
            ))}
          </div>
          <div style={{ marginTop: 16 }}>
            <div style={styles.fieldLabel}>Poids cible (optionnel)</div>
            <input type="number" step="0.1" value={profile.targetWeight} onChange={e => update('targetWeight', e.target.value)} style={styles.input} placeholder="Laisse vide si pas de cible précise" />
          </div>
        </>)}

        {step === 4 && (<>
          <div style={styles.stepHeader}>
            <div style={styles.setupKicker}>ÉTAPE 4 / 5</div>
            <h2 style={styles.stepTitle}>Niveau d'activité ?</h2>
            <p style={styles.stepSub}>Travail + loisirs habituels.</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {ACTIVITY_LEVELS.map(a => (
              <button key={a.id} onClick={() => update('activity', a.id)} style={{
                ...styles.actCard,
                borderColor: profile.activity === a.id ? profile.color : 'rgba(255,255,255,0.08)',
                background: profile.activity === a.id ? `${profile.color}10` : 'rgba(255,255,255,0.025)' }}>
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>{a.label}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>{a.desc}</div>
                </div>
                {profile.activity === a.id && <Check size={18} style={{ color: profile.color }} />}
              </button>
            ))}
          </div>
        </>)}

        {step === 5 && (<>
          <div style={styles.stepHeader}>
            <div style={styles.setupKicker}>TON PLAN</div>
            <h2 style={styles.stepTitle}>Voici ce qu'il te faut</h2>
          </div>
          <div style={{ ...styles.heroCard, marginBottom: 12 }}>
            <div style={styles.heroLabel}>OBJECTIF QUOTIDIEN</div>
            <div style={styles.heroBig}>{computed.kcal}<span style={styles.heroSub}>kcal</span></div>
            <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: 13 }}>
              <div><div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11 }}>PROTÉINES</div><div style={{ fontWeight: 600, marginTop: 2 }}>{computed.p}g</div></div>
              <div><div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11 }}>MÉTABOLISME</div><div style={{ fontWeight: 600, marginTop: 2 }}>{computed.bmr} kcal</div></div>
              <div><div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11 }}>DÉPENSE</div><div style={{ fontWeight: 600, marginTop: 2 }}>{computed.tdee} kcal</div></div>
            </div>
          </div>
          <div style={{ ...styles.formCard, marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <Dumbbell size={16} style={{ color: profile.color }} />
              <div style={{ fontSize: 11, letterSpacing: 1.5, fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>SÉANCES RECOMMANDÉES</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {WORKOUT_TEMPLATES[profile.goal]?.slice(0, 3).map(w => (
                <div key={w.name} style={{ padding: '8px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{w.name}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{w.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </>)}

        <div style={{ marginTop: 24, display: 'flex', gap: 10 }}>
          {step < 5 ? (
            <button onClick={() => canNext() && setStep(step + 1)} disabled={!canNext()}
              style={{ ...styles.btnPrimary, flex: 1, background: profile.color, opacity: canNext() ? 1 : 0.4 }}>
              Suivant <ArrowRight size={16} />
            </button>
          ) : (
            <button onClick={finish} style={{ ...styles.btnPrimary, flex: 1, background: profile.color }}>
              <Check size={16} /> Créer mon profil
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ColorPicker({ color, onChange }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
      {PROFILE_COLORS.map(c => (
        <button key={c} onClick={() => onChange(c)} style={{ ...styles.colorChip, background: c, outline: color === c ? '2px solid #fff' : 'none', outlineOffset: 2 }} />
      ))}
    </div>
  );
}

// ============================================
// DASHBOARD
// ============================================
function Dashboard({ totals, dayData, user, onUpdateUser, onUpdateWater }) {
  const [showWeightInput, setShowWeightInput] = useState(false);
  const [newWeight, setNewWeight] = useState(user.weight || '');

  const goalK = user.goals?.kcal || 2000;
  const goalP = user.goals?.p || 120;
  const pctK = Math.min(100, (totals.kcal / goalK) * 100);
  const workoutCount = dayData.workouts?.length || 0;
  const goal = GOALS.find(g => g.id === user.goal);
  const targetMacros = useMemo(() => computeMacros(user.goal, goalK, goalP), [user.goal, goalK, goalP]);

  const hydrationGoal = HYDRATION_GOAL_ML[user.sex] || 2000;
  const hydrationGlasses = Math.ceil(hydrationGoal / GLASS_ML);
  const waterGlasses = dayData.water || 0;

  const dailyTip = useMemo(() => getDailyTip(user.goal), [user.goal]);

  const weightProgress = useMemo(() => {
    if (!user.weight || !user.targetWeight) return null;
    const start = user.startWeight || user.weight;
    const total = Math.abs(user.targetWeight - start);
    const done = Math.abs(user.weight - start);
    return total === 0 ? 100 : Math.min(100, (done / total) * 100);
  }, [user]);

  const saveWeight = async () => {
    const w = Number(newWeight); if (!w) return;
    await onUpdateUser({ ...user, weight: w, startWeight: user.startWeight || user.weight || w });
    setShowWeightInput(false);
  };

  return (
    <div style={{ padding: '20px 18px 24px' }}>
      <h2 style={styles.h2}>Aujourd'hui</h2>

      <div style={{ ...styles.tipCard, borderLeft: `3px solid ${user.color}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <Lightbulb size={14} style={{ color: user.color }} />
          <div style={{ fontSize: 10, letterSpacing: 1.5, fontWeight: 700, color: 'rgba(255,255,255,0.55)' }}>CONSEIL DU JOUR</div>
        </div>
        <div style={{ fontSize: 14, lineHeight: 1.5, color: 'rgba(255,255,255,0.9)' }}>{dailyTip}</div>
      </div>

      <div style={styles.heroCard}>
        <div style={styles.heroLabel}>CALORIES</div>
        <div style={styles.heroBig}>{Math.round(totals.kcal)}<span style={styles.heroSub}>/ {goalK}</span></div>
        <div style={styles.progressTrack}><div style={{ ...styles.progressFill, width: `${pctK}%`, background: user.color }} /></div>
        <div style={styles.heroMeta}>{goalK - Math.round(totals.kcal) > 0 ? `${goalK - Math.round(totals.kcal)} kcal restantes` : `${Math.round(totals.kcal) - goalK} kcal au-dessus`}</div>
      </div>

      <div style={styles.macroGrid}>
        <MacroCard icon={<Beef size={16} />} label="Protéines" value={totals.p} goal={targetMacros.p} unit="g" color="#ff6b9d" />
        <MacroCard icon={<Wheat size={16} />} label="Glucides" value={totals.c} goal={targetMacros.c} unit="g" color="#ffa94d" />
        <MacroCard icon={<Droplet size={16} />} label="Lipides" value={totals.f} goal={targetMacros.f} unit="g" color="#5ce1e6" />
      </div>

      <div style={styles.weightCard}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <GlassWater size={16} style={{ color: '#74c0fc' }} />
            <div style={{ fontSize: 11, letterSpacing: 1.5, fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>HYDRATATION</div>
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{waterGlasses * GLASS_ML}ml / {hydrationGoal}ml</div>
        </div>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {Array.from({ length: hydrationGlasses }).map((_, i) => (
            <button key={i} onClick={() => onUpdateWater(i < waterGlasses ? i : i + 1)}
              style={{
                ...styles.waterGlass,
                background: i < waterGlasses ? '#74c0fc' : 'rgba(255,255,255,0.06)',
                borderColor: i < waterGlasses ? '#74c0fc' : 'rgba(255,255,255,0.1)',
              }}>
              <GlassWater size={14} style={{ color: i < waterGlasses ? '#0a0a0a' : 'rgba(255,255,255,0.3)' }} />
            </button>
          ))}
        </div>
      </div>

      <div style={styles.statCard}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ ...styles.statIcon, background: user.color, color: '#0a0a0a' }}><Dumbbell size={20} /></div>
          <div>
            <div style={styles.statBig}>{workoutCount}</div>
            <div style={styles.statLabel}>{workoutCount > 1 ? 'exercices effectués' : 'exercice effectué'}</div>
          </div>
        </div>
      </div>

      {user.weight && (
        <div style={styles.weightCard}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Scale size={16} style={{ color: user.color }} />
              <div style={{ fontSize: 11, letterSpacing: 1.5, fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>POIDS</div>
            </div>
            <button onClick={() => setShowWeightInput(true)} style={styles.miniBtn}><Edit3 size={12} /> Mettre à jour</button>
          </div>
          {showWeightInput ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <input type="number" step="0.1" value={newWeight} onChange={e => setNewWeight(e.target.value)} style={{ ...styles.input, flex: 1 }} autoFocus />
              <button onClick={saveWeight} style={{ ...styles.btnPrimary, background: user.color, padding: '0 14px' }}><Check size={16} /></button>
              <button onClick={() => setShowWeightInput(false)} style={styles.iconBtn}><X size={16} /></button>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <div style={{ fontFamily: 'Fraunces, serif', fontSize: 36, fontWeight: 700, letterSpacing: -1.5 }}>
                  {user.weight}<span style={{ fontSize: 16, color: 'rgba(255,255,255,0.4)', marginLeft: 4, fontWeight: 400 }}>kg</span>
                </div>
                {user.targetWeight && <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginLeft: 'auto' }}>cible: {user.targetWeight} kg</div>}
              </div>
              {weightProgress !== null && (
                <div style={{ marginTop: 10 }}>
                  <div style={styles.progressTrack}><div style={{ ...styles.progressFill, width: `${weightProgress}%`, background: user.color }} /></div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 6 }}>{weightProgress.toFixed(0)}% du chemin parcouru</div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {goal && (
        <div style={styles.programCard}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Target size={14} style={{ color: goal.accent }} />
            <div style={{ fontSize: 10, letterSpacing: 2, fontWeight: 700, color: 'rgba(255,255,255,0.55)' }}>TON OBJECTIF · {goal.label.toUpperCase()}</div>
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.4 }}>
            Macros cibles : <strong style={{ color: '#ff6b9d' }}>{targetMacros.p}g P</strong> · <strong style={{ color: '#ffa94d' }}>{targetMacros.c}g G</strong> · <strong style={{ color: '#5ce1e6' }}>{targetMacros.f}g L</strong>
          </div>
        </div>
      )}

      {dayData.meals?.length > 0 && (<>
        <div style={styles.sectionLabel}>Repas enregistrés</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {dayData.meals.slice(-5).reverse().map((m, i) => (
            <div key={i} style={styles.miniRow}>
              <div style={{ flex: 1 }}><div style={styles.miniTitle}>{m.name}</div><div style={styles.miniMeta}>{m.portion}</div></div>
              <div style={styles.miniKcal}>{Math.round(m.kcal)} kcal</div>
            </div>
          ))}
        </div>
      </>)}

      {dayData.workouts?.length > 0 && (<>
        <div style={styles.sectionLabel}>Séance du jour</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {dayData.workouts.map((w, i) => (
            <div key={i} style={styles.miniRow}>
              <div style={{ flex: 1 }}>
                <div style={styles.miniTitle}>{w.name}</div>
                <div style={styles.miniMeta}>
                  {w.type === 'cardio' && `${w.duration || 0} min · ${w.distance || 0} km`}
                  {w.type === 'time' && `${w.sets?.length || 0} × ${w.sets?.[0]?.time || 0}s`}
                  {w.type === 'strength' && `${w.sets?.length || 0} séries · ${w.sets?.reduce((s, x) => s + (Number(x.reps) || 0), 0) || 0} reps`}
                </div>
              </div>
              <div style={{ ...styles.miniKcal, color: user.color }}>{w.cat}</div>
            </div>
          ))}
        </div>
      </>)}

      {dayData.meals?.length === 0 && dayData.workouts?.length === 0 && (
        <div style={styles.emptyHint}>
          <Activity size={28} style={{ opacity: 0.4 }} />
          <div>Rien enregistré pour ce jour.</div>
          <div style={{ fontSize: 13, opacity: 0.5, marginTop: 4 }}>Utilisez les onglets Nutrition et Sport pour commencer.</div>
        </div>
      )}
    </div>
  );
}

function MacroCard({ icon, label, value, goal, unit, color }) {
  const pct = goal ? Math.min(100, (value / goal) * 100) : 0;
  return (
    <div style={styles.macroCard}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color }}>{icon}<span style={styles.macroLabel}>{label}</span></div>
      <div style={styles.macroVal}>{Math.round(value)}<span style={styles.macroUnit}>{unit}</span></div>
      {goal && (<>
        <div style={styles.macroGoal}>/ {goal}{unit}</div>
        <div style={{ height: 3, background: 'rgba(255,255,255,0.05)', borderRadius: 2, marginTop: 6, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: color, transition: 'width 0.3s' }} />
        </div>
      </>)}
    </div>
  );
}

// ============================================
// NUTRITION
// ============================================
function Nutrition({ meals, onUpdate, user }) {
  const [mode, setMode] = useState(null);
  const [foodSearch, setFoodSearch] = useState('');
  const [foodCat, setFoodCat] = useState('all');
  const [recipeMoment, setRecipeMoment] = useState('all');
  const [custom, setCustom] = useState({ name: '', portion: '', kcal: '', p: '', c: '', f: '' });

  const addMeal = (m) => { onUpdate([...meals, { ...m, id: Date.now() }]); setMode(null); };
  const removeMeal = (id) => onUpdate(meals.filter(m => m.id !== id));

  const foodCategories = useMemo(() => ['all', ...new Set(FOODS.map(f => f.cat))], []);
  const filteredFoods = useMemo(() => FOODS.filter(f => {
    if (foodCat !== 'all' && f.cat !== foodCat) return false;
    if (foodSearch && !f.name.toLowerCase().includes(foodSearch.toLowerCase())) return false;
    return true;
  }), [foodSearch, foodCat]);

  const filteredRecipes = useMemo(() => RECIPES.filter(r => {
    if (recipeMoment !== 'all' && r.moment !== recipeMoment) return false;
    if (user.goal && !r.goals.includes(user.goal)) return false;
    return true;
  }), [recipeMoment, user.goal]);

  const submitCustom = () => {
    if (!custom.name.trim()) return;
    addMeal({ name: custom.name, portion: custom.portion || 'portion',
      kcal: Number(custom.kcal) || 0, p: Number(custom.p) || 0,
      c: Number(custom.c) || 0, f: Number(custom.f) || 0 });
    setCustom({ name: '', portion: '', kcal: '', p: '', c: '', f: '' });
  };

  return (
    <div style={{ padding: '20px 18px 24px' }}>
      <h2 style={styles.h2}>Nutrition</h2>

      {!mode && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 20 }}>
          <button onClick={() => setMode('foods')} style={{ ...styles.btnGhost, flexDirection: 'column', padding: '14px 8px', gap: 6 }}>
            <Apple size={20} /><span style={{ fontSize: 12 }}>Aliments</span>
          </button>
          <button onClick={() => setMode('recipes')} style={{ ...styles.btnGhost, flexDirection: 'column', padding: '14px 8px', gap: 6 }}>
            <ChefHat size={20} /><span style={{ fontSize: 12 }}>Recettes</span>
          </button>
          <button onClick={() => setMode('custom')} style={{ ...styles.btnGhost, flexDirection: 'column', padding: '14px 8px', gap: 6 }}>
            <Edit3 size={20} /><span style={{ fontSize: 12 }}>Libre</span>
          </button>
        </div>
      )}

      {mode === 'foods' && (
        <div style={styles.panel}>
          <div style={styles.panelHead}>
            <div style={styles.panelTitle}>Base alimentaire</div>
            <button onClick={() => setMode(null)} style={styles.iconBtn}><X size={16} /></button>
          </div>
          <div style={{ position: 'relative', marginTop: 12 }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: 14, color: 'rgba(255,255,255,0.4)' }} />
            <input value={foodSearch} onChange={e => setFoodSearch(e.target.value)} placeholder="Rechercher un aliment…" style={{ ...styles.input, paddingLeft: 36 }} />
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 10, overflowX: 'auto', paddingBottom: 4 }}>
            {foodCategories.map(c => (
              <button key={c} onClick={() => setFoodCat(c)} style={{
                ...styles.chip,
                background: foodCat === c ? user.color : 'rgba(255,255,255,0.05)',
                color: foodCat === c ? '#0a0a0a' : 'rgba(255,255,255,0.7)',
              }}>{c === 'all' ? 'Tout' : c}</button>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 360, overflowY: 'auto', marginTop: 12 }}>
            {filteredFoods.length === 0 ? (
              <div style={{ padding: 20, textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>Aucun aliment trouvé</div>
            ) : filteredFoods.map((f, i) => (
              <button key={i} onClick={() => addMeal(f)} style={styles.quickFoodRow}>
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div style={styles.miniTitle}>{f.name}</div>
                  <div style={styles.miniMeta}>{f.portion} · P{Math.round(f.p)} G{Math.round(f.c)} L{Math.round(f.f)}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: user.color, fontWeight: 600 }}>{f.kcal}</div>
                  <div style={styles.miniMeta}>kcal</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {mode === 'recipes' && (
        <div style={styles.panel}>
          <div style={styles.panelHead}>
            <div>
              <div style={styles.panelTitle}>Recettes</div>
              {user.goal && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>Adaptées à : {GOALS.find(g => g.id === user.goal)?.label}</div>}
            </div>
            <button onClick={() => setMode(null)} style={styles.iconBtn}><X size={16} /></button>
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 12, overflowX: 'auto', paddingBottom: 4 }}>
            <button onClick={() => setRecipeMoment('all')} style={{
              ...styles.chip,
              background: recipeMoment === 'all' ? user.color : 'rgba(255,255,255,0.05)',
              color: recipeMoment === 'all' ? '#0a0a0a' : 'rgba(255,255,255,0.7)',
            }}>Tout</button>
            {MEAL_MOMENTS.map(m => (
              <button key={m.id} onClick={() => setRecipeMoment(m.id)} style={{
                ...styles.chip,
                background: recipeMoment === m.id ? user.color : 'rgba(255,255,255,0.05)',
                color: recipeMoment === m.id ? '#0a0a0a' : 'rgba(255,255,255,0.7)',
              }}>{m.icon} {m.label}</button>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 420, overflowY: 'auto', marginTop: 12 }}>
            {filteredRecipes.length === 0 ? (
              <div style={{ padding: 20, textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>Aucune recette pour ces filtres</div>
            ) : filteredRecipes.map((r, i) => (
              <button key={i} onClick={() => addMeal({ name: r.name, portion: r.desc.substring(0, 60) + (r.desc.length > 60 ? '…' : ''), kcal: r.kcal, p: r.p, c: r.c, f: r.f })}
                style={styles.recipeCard}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <span style={{ fontSize: 20 }}>{MEAL_MOMENTS.find(m => m.id === r.moment)?.icon}</span>
                  <div style={{ flex: 1, textAlign: 'left' }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{r.name}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 4, lineHeight: 1.4 }}>{r.desc}</div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 8, fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>
                      <span style={{ color: user.color, fontWeight: 600 }}>{r.kcal} kcal</span>
                      <span>· P{r.p}</span><span>G{r.c}</span><span>L{r.f}</span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {mode === 'custom' && (
        <div style={styles.panel}>
          <div style={styles.panelHead}>
            <div style={styles.panelTitle}>Saisie libre</div>
            <button onClick={() => setMode(null)} style={styles.iconBtn}><X size={16} /></button>
          </div>
          <input value={custom.name} onChange={e => setCustom({ ...custom, name: e.target.value })} placeholder="Nom de l'aliment ou repas" style={{ ...styles.input, marginTop: 12 }} />
          <input value={custom.portion} onChange={e => setCustom({ ...custom, portion: e.target.value })} placeholder="Portion" style={{ ...styles.input, marginTop: 8 }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
            <input type="number" value={custom.kcal} onChange={e => setCustom({ ...custom, kcal: e.target.value })} placeholder="Calories" style={styles.input} />
            <input type="number" value={custom.p} onChange={e => setCustom({ ...custom, p: e.target.value })} placeholder="Protéines (g)" style={styles.input} />
            <input type="number" value={custom.c} onChange={e => setCustom({ ...custom, c: e.target.value })} placeholder="Glucides (g)" style={styles.input} />
            <input type="number" value={custom.f} onChange={e => setCustom({ ...custom, f: e.target.value })} placeholder="Lipides (g)" style={styles.input} />
          </div>
          <button onClick={submitCustom} style={{ ...styles.btnPrimary, width: '100%', marginTop: 12, background: user.color }}><Save size={16} /> Ajouter</button>
        </div>
      )}

      <div style={styles.sectionLabel}>Repas du jour ({meals.length})</div>
      {meals.length === 0 ? (
        <div style={styles.emptyHint}>
          <Apple size={28} style={{ opacity: 0.4 }} />
          <div>Aucun repas enregistré.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {meals.map(m => (
            <div key={m.id} style={styles.mealRow}>
              <div style={{ flex: 1 }}>
                <div style={styles.miniTitle}>{m.name}</div>
                <div style={styles.miniMeta}>{m.portion} · P{Math.round(m.p)}g · G{Math.round(m.c)}g · L{Math.round(m.f)}g</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: user.color, fontWeight: 600 }}>{Math.round(m.kcal)}</div>
                <div style={styles.miniMeta}>kcal</div>
              </div>
              <button onClick={() => removeMeal(m.id)} style={styles.deleteBtn}><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================
// SPORT
// ============================================
function Sport({ workouts, onUpdate, user }) {
  const [mode, setMode] = useState(null);
  const [editing, setEditing] = useState(null);
  const [showTip, setShowTip] = useState(false);

  const recommendedNames = useMemo(() => {
    if (!user.goal) return [];
    const all = WORKOUT_TEMPLATES[user.goal] || [];
    return [...new Set(all.flatMap(t => t.exercises))];
  }, [user.goal]);

  const recommendedExercises = useMemo(() => recommendedNames.map(n => EXERCISES.find(e => e.name === n)).filter(Boolean), [recommendedNames]);

  const categories = useMemo(() => {
    const map = {};
    EXERCISES.forEach(e => { if (!map[e.cat]) map[e.cat] = []; map[e.cat].push(e); });
    return map;
  }, []);

  const startExercise = (ex) => {
    const rec = ex.reps?.[user.goal] || ex.reps?.maintain;
    const numSets = (typeof rec === 'object' && rec?.s) || 3;
    setEditing({
      ...ex, id: Date.now(),
      sets: ex.type === 'cardio' ? null : Array.from({ length: numSets }, () => ({ reps: '', weight: '', time: '' })),
      duration: '', distance: '', suggested: rec,
    });
    setMode(null); setShowTip(false);
  };

  const startWorkoutTemplate = (template) => {
    const newWorkouts = template.exercises.map(name => {
      const ex = EXERCISES.find(e => e.name === name);
      if (!ex) return null;
      const rec = ex.reps?.[user.goal] || ex.reps?.maintain;
      const numSets = (typeof rec === 'object' && rec?.s) || 3;
      return {
        ...ex, id: Date.now() + Math.random(),
        sets: ex.type === 'cardio' ? null : Array.from({ length: numSets }, () => ({ reps: '', weight: '', time: '' })),
        duration: '', distance: '',
      };
    }).filter(Boolean);
    onUpdate([...workouts, ...newWorkouts]);
    setMode(null);
  };

  const saveExercise = () => { if (editing) { onUpdate([...workouts, editing]); setEditing(null); } };
  const removeWorkout = (id) => onUpdate(workouts.filter(w => w.id !== id));

  return (
    <div style={{ padding: '20px 18px 24px' }}>
      <h2 style={styles.h2}>Sport</h2>

      {user.goal && (
        <div style={styles.programCard}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Target size={14} style={{ color: user.color }} />
            <div style={{ fontSize: 10, letterSpacing: 2, fontWeight: 700, color: 'rgba(255,255,255,0.55)' }}>OBJECTIF · {GOALS.find(g => g.id === user.goal)?.label.toUpperCase()}</div>
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.4 }}>
            Tes séries et repos sont calibrés automatiquement pour ton objectif.
          </div>
        </div>
      )}

      {!mode && !editing && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
          <button onClick={() => setMode('templates')} style={{ ...styles.btnGhost, flexDirection: 'column', padding: '14px 8px', gap: 6 }}>
            <ListChecks size={20} /><span style={{ fontSize: 12 }}>Séance complète</span>
          </button>
          <button onClick={() => setMode('pick')} style={{ ...styles.btnPrimary, background: user.color, flexDirection: 'column', padding: '14px 8px', gap: 6 }}>
            <Plus size={20} /><span style={{ fontSize: 12 }}>Un exercice</span>
          </button>
        </div>
      )}

      {mode === 'templates' && (
        <div style={styles.panel}>
          <div style={styles.panelHead}>
            <div>
              <div style={styles.panelTitle}>Séances complètes</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>Pour ton objectif {GOALS.find(g => g.id === user.goal)?.label.toLowerCase()}</div>
            </div>
            <button onClick={() => setMode(null)} style={styles.iconBtn}><X size={16} /></button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 14 }}>
            {(WORKOUT_TEMPLATES[user.goal] || WORKOUT_TEMPLATES.maintain).map((t, i) => (
              <button key={i} onClick={() => startWorkoutTemplate(t)} style={styles.templateCard}>
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div style={{ fontFamily: 'Fraunces, serif', fontSize: 17, fontWeight: 600, letterSpacing: -0.3 }}>{t.name}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>{t.desc}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
                    {t.exercises.slice(0, 4).map(e => <span key={e} style={styles.tagSmall}>{e}</span>)}
                    {t.exercises.length > 4 && <span style={styles.tagSmall}>+{t.exercises.length - 4}</span>}
                  </div>
                </div>
                <Plus size={18} style={{ color: user.color }} />
              </button>
            ))}
          </div>
        </div>
      )}

      {mode === 'pick' && (
        <div style={styles.panel}>
          <div style={styles.panelHead}>
            <div style={styles.panelTitle}>Choisir un exercice</div>
            <button onClick={() => setMode(null)} style={styles.iconBtn}><X size={16} /></button>
          </div>
          <div style={{ marginTop: 12, maxHeight: 520, overflowY: 'auto' }}>
            {recommendedExercises.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ ...styles.catLabel, color: user.color, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Star size={11} fill={user.color} /> RECOMMANDÉS POUR TOI
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {recommendedExercises.map(ex => (
                    <button key={ex.name} onClick={() => startExercise(ex)} style={{ ...styles.exRow, borderColor: `${user.color}30`, background: `${user.color}08` }}>
                      <div style={{ flex: 1, textAlign: 'left' }}>
                        <div>{ex.name}</div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{ex.cat}</div>
                      </div>
                      <ChevronRight size={14} style={{ opacity: 0.4 }} />
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div style={{ ...styles.catLabel, color: 'rgba(255,255,255,0.5)' }}>TOUS LES EXERCICES</div>
            {Object.entries(categories).map(([cat, items]) => (
              <div key={cat} style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.6)', letterSpacing: 0.5, marginBottom: 6, marginTop: 12 }}>{cat}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {items.map(ex => (
                    <button key={ex.name} onClick={() => startExercise(ex)} style={styles.exRow}>
                      <span>{ex.name}</span>
                      <ChevronRight size={14} style={{ opacity: 0.4 }} />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {editing && (
        <div style={styles.panel}>
          <div style={styles.panelHead}>
            <div>
              <div style={{ ...styles.catLabel, color: user.color }}>{editing.cat}</div>
              <div style={styles.panelTitle}>{editing.name}</div>
            </div>
            <button onClick={() => setEditing(null)} style={styles.iconBtn}><X size={16} /></button>
          </div>

          {editing.suggested && (
            <div style={styles.recoBox}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <Target size={12} style={{ color: user.color }} />
                <div style={{ fontSize: 10, letterSpacing: 1.5, fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>RECOMMANDÉ POUR TOI</div>
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)' }}>
                {typeof editing.suggested === 'object'
                  ? `${editing.suggested.s} séries × ${editing.suggested.r}${editing.type !== 'time' ? ' reps' : ''} · repos ${editing.suggested.t}s`
                  : editing.suggested}
              </div>
            </div>
          )}

          {editing.muscles && (
            <button onClick={() => setShowTip(!showTip)} style={styles.techBtn}>
              <Info size={13} />
              <span style={{ flex: 1, textAlign: 'left' }}>Muscles & technique</span>
              {showTip ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          )}
          {showTip && (
            <div style={styles.techBox}>
              <div style={{ fontSize: 11, color: user.color, fontWeight: 600, marginBottom: 4 }}>MUSCLES SOLLICITÉS</div>
              <div style={{ fontSize: 13, marginBottom: 10 }}>{editing.muscles}</div>
              <div style={{ fontSize: 11, color: user.color, fontWeight: 600, marginBottom: 4 }}>TECHNIQUE</div>
              <div style={{ fontSize: 13, lineHeight: 1.5, color: 'rgba(255,255,255,0.85)' }}>{editing.tip}</div>
            </div>
          )}

          {editing.type === 'cardio' ? (
            <div style={{ marginTop: 14 }}>
              <div style={styles.fieldLabel}>Durée (min)</div>
              <input type="number" value={editing.duration} onChange={e => setEditing({ ...editing, duration: e.target.value })} style={styles.input} placeholder="30" />
              <div style={{ ...styles.fieldLabel, marginTop: 12 }}>Distance (km, optionnel)</div>
              <input type="number" step="0.1" value={editing.distance} onChange={e => setEditing({ ...editing, distance: e.target.value })} style={styles.input} placeholder="5.2" />
            </div>
          ) : (
            <div style={{ marginTop: 14 }}>
              <div style={styles.fieldLabel}>Séries</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {editing.sets.map((s, i) => (
                  <div key={i} style={styles.setRow}>
                    <div style={styles.setNum}>{i + 1}</div>
                    {editing.type === 'time' ? (
                      <input type="number" value={s.time} onChange={e => {
                        const sets = [...editing.sets]; sets[i] = { ...s, time: e.target.value };
                        setEditing({ ...editing, sets });
                      }} placeholder="secondes" style={{ ...styles.input, flex: 1 }} />
                    ) : (<>
                      <input type="number" value={s.reps} onChange={e => {
                        const sets = [...editing.sets]; sets[i] = { ...s, reps: e.target.value };
                        setEditing({ ...editing, sets });
                      }} placeholder="reps" style={{ ...styles.input, flex: 1 }} />
                      <input type="number" step="0.5" value={s.weight} onChange={e => {
                        const sets = [...editing.sets]; sets[i] = { ...s, weight: e.target.value };
                        setEditing({ ...editing, sets });
                      }} placeholder="kg" style={{ ...styles.input, flex: 1 }} />
                    </>)}
                    {editing.sets.length > 1 && (
                      <button onClick={() => {
                        const sets = editing.sets.filter((_, idx) => idx !== i);
                        setEditing({ ...editing, sets });
                      }} style={styles.deleteBtn}><X size={14} /></button>
                    )}
                  </div>
                ))}
              </div>
              <button onClick={() => setEditing({ ...editing, sets: [...editing.sets, { reps: '', weight: '', time: '' }] })} style={{ ...styles.btnGhost, width: '100%', marginTop: 8 }}>
                <Plus size={14} /> Ajouter une série
              </button>
            </div>
          )}

          <button onClick={saveExercise} style={{ ...styles.btnPrimary, width: '100%', marginTop: 16, background: user.color }}><Save size={16} /> Enregistrer</button>
        </div>
      )}

      <div style={styles.sectionLabel}>Exercices du jour ({workouts.length})</div>
      {workouts.length === 0 ? (
        <div style={styles.emptyHint}>
          <Dumbbell size={28} style={{ opacity: 0.4 }} />
          <div>Aucun exercice enregistré.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {workouts.map(w => (
            <div key={w.id} style={styles.mealRow}>
              <div style={{ flex: 1 }}>
                <div style={styles.miniTitle}>{w.name}</div>
                <div style={styles.miniMeta}>
                  {w.cat}
                  {w.type === 'cardio' && ` · ${w.duration || 0} min${w.distance ? ` · ${w.distance} km` : ''}`}
                  {w.type === 'strength' && w.sets && ` · ${w.sets.map(s => `${s.reps || 0}×${s.weight || 0}kg`).join(' · ')}`}
                  {w.type === 'time' && w.sets && ` · ${w.sets.map(s => `${s.time || 0}s`).join(' · ')}`}
                </div>
              </div>
              <button onClick={() => removeWorkout(w.id)} style={styles.deleteBtn}><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================
// HISTORIQUE
// ============================================
function HistoryView({ user }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await storage.list(`data:${user.id}:`);
        if (res?.keys) {
          const sorted = res.keys.sort().reverse();
          const items = [];
          for (const key of sorted.slice(0, 14)) {
            const date = key.split(':').pop();
            try {
              const dayRes = await storage.get(key);
              if (dayRes?.value) {
                const data = JSON.parse(dayRes.value);
                const kcal = (data.meals || []).reduce((s, m) => s + (m.kcal || 0), 0);
                items.push({ date, kcal, workouts: data.workouts?.length || 0, meals: data.meals?.length || 0, water: data.water || 0 });
              }
            } catch {}
          }
          setHistory(items);
        }
      } catch (e) { console.error(e); }
      setLoading(false);
    })();
  }, [user.id]);

  return (
    <div style={{ padding: '20px 18px 24px' }}>
      <h2 style={styles.h2}>Historique</h2>
      <div style={{ ...styles.sectionLabel, marginTop: 4 }}>14 derniers jours enregistrés</div>
      {loading ? (
        <div style={{ opacity: 0.5, padding: 20, textAlign: 'center' }}>Chargement…</div>
      ) : history.length === 0 ? (
        <div style={styles.emptyHint}><TrendingUp size={28} style={{ opacity: 0.4 }} /><div>Pas encore d'historique.</div></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {history.map(h => (
            <div key={h.date} style={styles.histRow}>
              <div style={{ flex: 1 }}>
                <div style={styles.miniTitle}>{h.date === todayStr() ? "Aujourd'hui" : formatDateFR(h.date)}</div>
                <div style={styles.miniMeta}>{h.meals} repas · {h.workouts} exercices · {h.water * GLASS_ML}ml eau</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: user.color, fontWeight: 600, fontSize: 18 }}>{Math.round(h.kcal)}</div>
                <div style={styles.miniMeta}>kcal</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================
// HELPERS UI
// ============================================
function NavBtn({ icon, label, active, onClick, color }) {
  return (
    <button onClick={onClick} style={{ ...styles.navBtn, color: active ? color : 'rgba(255,255,255,0.5)' }}>
      {icon}<span style={{ fontSize: 10, marginTop: 4, fontWeight: 600, letterSpacing: 0.5 }}>{label.toUpperCase()}</span>
    </button>
  );
}

function FontImport() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,800&family=Geist:wght@400;500;600;700&display=swap');
      * { box-sizing: border-box; }
      body, html, #root { margin: 0; padding: 0; }
      input::placeholder { color: rgba(255,255,255,0.3); }
      input:focus { outline: none; border-color: rgba(255,255,255,0.4) !important; }
      button { cursor: pointer; font-family: inherit; }
      ::-webkit-scrollbar { width: 6px; height: 4px; }
      ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 3px; }
    `}</style>
  );
}

const styles = {
  app: { minHeight: '100vh', background: '#0a0a0a', color: '#f5f5f0', fontFamily: "'Geist', -apple-system, sans-serif", paddingBottom: 80, maxWidth: 480, margin: '0 auto', position: 'relative' },
  center: { display: 'flex', alignItems: 'center', justifyContent: 'center' },
  header: { position: 'sticky', top: 0, background: 'rgba(10,10,10,0.92)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)', zIndex: 10 },
  headerInner: { padding: '16px 18px 8px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' },
  brand: { fontFamily: 'Fraunces, serif', fontSize: 22, fontWeight: 800, letterSpacing: -0.5, lineHeight: 1 },
  userBadge: { fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)', marginTop: 6, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 },
  userDot: { width: 8, height: 8, borderRadius: '50%' },
  iconBtn: { background: 'rgba(255,255,255,0.06)', border: 'none', color: '#f5f5f0', width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  dateBar: { padding: '8px 18px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  dateBtn: { background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#f5f5f0', width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  dateLabel: { flex: 1, textAlign: 'center', fontSize: 14, fontWeight: 500, textTransform: 'capitalize' },
  h2: { fontFamily: 'Fraunces, serif', fontSize: 36, fontWeight: 600, letterSpacing: -1.5, margin: '4px 0 20px', lineHeight: 1 },
  tipCard: { background: 'rgba(255,255,255,0.03)', padding: '12px 16px', borderRadius: 12, marginBottom: 16 },
  heroCard: { background: 'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: 24, marginBottom: 14 },
  heroLabel: { fontSize: 10, letterSpacing: 2, color: 'rgba(255,255,255,0.45)', fontWeight: 700, marginBottom: 8 },
  heroBig: { fontFamily: 'Fraunces, serif', fontSize: 56, fontWeight: 800, letterSpacing: -2.5, lineHeight: 1 },
  heroSub: { fontSize: 20, color: 'rgba(255,255,255,0.35)', marginLeft: 8, fontWeight: 400 },
  progressTrack: { height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, marginTop: 16, overflow: 'hidden' },
  progressFill: { height: '100%', transition: 'width 0.4s ease' },
  heroMeta: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 10 },
  macroGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 14 },
  macroCard: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: 14 },
  macroLabel: { fontSize: 11, letterSpacing: 0.5, fontWeight: 600 },
  macroVal: { fontFamily: 'Fraunces, serif', fontSize: 22, fontWeight: 700, marginTop: 6, letterSpacing: -0.5 },
  macroUnit: { fontSize: 11, color: 'rgba(255,255,255,0.4)', marginLeft: 2 },
  macroGoal: { fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 2 },
  statCard: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: 16, marginBottom: 14 },
  statIcon: { width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  statBig: { fontFamily: 'Fraunces, serif', fontSize: 28, fontWeight: 700, letterSpacing: -1, lineHeight: 1 },
  statLabel: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4 },
  weightCard: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: 16, marginBottom: 14 },
  programCard: { background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: 14, marginBottom: 14 },
  waterGlass: { width: 36, height: 36, border: '1px solid', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' },
  miniBtn: { background: 'rgba(255,255,255,0.05)', border: 'none', color: 'rgba(255,255,255,0.7)', padding: '6px 10px', borderRadius: 8, fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 },
  sectionLabel: { fontSize: 10, letterSpacing: 2, color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase', marginTop: 24, marginBottom: 10 },
  miniRow: { display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12, padding: '12px 14px' },
  miniTitle: { fontSize: 14, fontWeight: 500 },
  miniMeta: { fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2 },
  miniKcal: { fontSize: 13, fontWeight: 600 },
  emptyHint: { textAlign: 'center', padding: 32, color: 'rgba(255,255,255,0.5)', fontSize: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.02)', borderRadius: 14, border: '1px dashed rgba(255,255,255,0.08)' },
  nav: { position: 'fixed', bottom: 0, left: 0, right: 0, background: 'rgba(10,10,10,0.95)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', padding: '10px 0 16px', maxWidth: 480, margin: '0 auto', zIndex: 20 },
  navBtn: { flex: 1, background: 'transparent', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 6, transition: 'color 0.15s' },
  btnPrimary: { background: '#d4ff3a', color: '#0a0a0a', border: 'none', padding: '12px 16px', borderRadius: 12, fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 },
  btnGhost: { background: 'rgba(255,255,255,0.05)', color: '#f5f5f0', border: '1px solid rgba(255,255,255,0.1)', padding: '12px 16px', borderRadius: 12, fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 },
  panel: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 16, marginBottom: 20 },
  panelHead: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  panelTitle: { fontFamily: 'Fraunces, serif', fontSize: 20, fontWeight: 600, letterSpacing: -0.5 },
  input: { width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '12px 14px', color: '#f5f5f0', fontSize: 14, fontFamily: 'inherit' },
  fieldLabel: { fontSize: 11, letterSpacing: 1, color: 'rgba(255,255,255,0.5)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 6 },
  chip: { padding: '6px 12px', borderRadius: 20, border: 'none', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', transition: 'all 0.15s' },
  quickFoodRow: { background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 10, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12, color: '#f5f5f0' },
  recipeCard: { background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12, padding: '14px', color: '#f5f5f0' },
  templateCard: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 14, display: 'flex', alignItems: 'center', gap: 12, color: '#f5f5f0' },
  mealRow: { background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 },
  deleteBtn: { background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', padding: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  catLabel: { fontSize: 10, letterSpacing: 2, fontWeight: 700, textTransform: 'uppercase', marginBottom: 8, marginTop: 4 },
  exRow: { background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 10, padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#f5f5f0', fontSize: 14, textAlign: 'left' },
  setRow: { display: 'flex', alignItems: 'center', gap: 8 },
  setNum: { width: 28, height: 28, borderRadius: 6, background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 },
  histRow: { background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 },
  setupWrap: { padding: '40px 24px 40px', minHeight: '100vh', display: 'flex', flexDirection: 'column' },
  setupHero: { marginBottom: 32 },
  setupKicker: { fontSize: 11, letterSpacing: 3, color: 'rgba(255,255,255,0.4)', fontWeight: 700, marginBottom: 12 },
  setupTitle: { fontFamily: 'Fraunces, serif', fontSize: 56, fontWeight: 800, letterSpacing: -2.5, lineHeight: 0.95, margin: 0 },
  setupLede: { fontSize: 15, color: 'rgba(255,255,255,0.6)', marginTop: 16, lineHeight: 1.5, maxWidth: 320 },
  stepHeader: { marginBottom: 24 },
  stepTitle: { fontFamily: 'Fraunces, serif', fontSize: 36, fontWeight: 700, letterSpacing: -1.5, lineHeight: 1.05, margin: '8px 0 0' },
  stepSub: { fontSize: 14, color: 'rgba(255,255,255,0.55)', marginTop: 10, lineHeight: 1.4 },
  stepIndicator: { display: 'flex', gap: 6 },
  stepDot: { height: 6, borderRadius: 3, transition: 'all 0.25s' },
  backBtn: { background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.55)', fontSize: 13, padding: '8px 0', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 500 },
  profileCard: { display: 'flex', alignItems: 'stretch', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, overflow: 'hidden' },
  profileBtn: { flex: 1, background: 'transparent', border: 'none', padding: '18px 16px', display: 'flex', alignItems: 'center', gap: 14, color: '#f5f5f0', textAlign: 'left' },
  profileDot: { width: 12, height: 12, borderRadius: '50%' },
  profileName: { fontSize: 17, fontWeight: 600, letterSpacing: -0.3 },
  profileRemove: { background: 'transparent', border: 'none', borderLeft: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.35)', padding: '0 16px', display: 'flex', alignItems: 'center' },
  addProfileBtn: { background: 'transparent', border: '1px dashed rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.7)', padding: 16, borderRadius: 14, fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 },
  formCard: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 20 },
  colorChip: { width: 32, height: 32, borderRadius: '50%', border: 'none', cursor: 'pointer' },
  footerNote: { marginTop: 'auto', fontSize: 11, color: 'rgba(255,255,255,0.3)', textAlign: 'center', paddingTop: 32, letterSpacing: 0.3 },
  choiceCard: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 18, display: 'flex', alignItems: 'center', gap: 14, color: '#f5f5f0' },
  choiceIcon: { width: 48, height: 48, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  choiceTitle: { fontFamily: 'Fraunces, serif', fontSize: 20, fontWeight: 600, letterSpacing: -0.5, marginBottom: 4 },
  choiceDesc: { fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.45 },
  toggleBtn: { flex: 1, padding: '12px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)', fontWeight: 600, fontSize: 14, transition: 'all 0.15s' },
  goalCard: { padding: 14, borderRadius: 14, border: '1px solid', transition: 'all 0.15s', cursor: 'pointer' },
  actCard: { padding: '14px 16px', borderRadius: 12, border: '1px solid', display: 'flex', alignItems: 'center', gap: 12, transition: 'all 0.15s', cursor: 'pointer' },
  tagSmall: { fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.75)' },
  recoBox: { background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 10, marginTop: 14, marginBottom: 8 },
  techBtn: { width: '100%', background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.75)', padding: '10px 12px', borderRadius: 10, fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 },
  techBox: { background: 'rgba(255,255,255,0.025)', borderRadius: 10, padding: 12, marginTop: 8 },
};
