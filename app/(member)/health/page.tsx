"use client";

import { useEffect, useState } from "react";
import {
  Droplets, Footprints, Moon, NotebookPen, Save,
  Utensils, Pill, Plus, Trash2, ChevronLeft, ChevronRight, Search, Calculator,
} from "lucide-react";
import { getSupabase } from "@/lib/supabase";
import { useProfile } from "@/lib/useProfile";

type MealType = "Frühstück" | "Mittagessen" | "Abendessen" | "Snacks";
type Meal = {
  id: string;
  type: MealType;
  name: string;
  amount: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
};
type Supplement = {
  id: string;
  name: string;
  dose: string;
  time: string;
  taken: boolean;
};
type DayData = {
  steps: number;
  waterMl: number;
  sleepMinutes: number;
  note: string;
  meals: Meal[];
  supplements: Supplement[];
};
type Goal = "Alle" | "Muskelaufbau" | "Fettabbau" | "Regeneration" | "Ausdauer" | "Gesundheit";
type Supplement = {
  id: string; name: string; goals: Exclude<Goal, "Alle">[];
  benefit: string; evidence: string; caution: string;
};
const CATALOG: Supplement[] = [
  {id:"creatine",name:"Kreatin-Monohydrat",goals:["Muskelaufbau","Regeneration"],benefit:"Unterstützt Kraft und Leistung bei kurzen, intensiven Belastungen.",evidence:"Sehr gut untersucht.",caution:"Bei Nierenerkrankungen vorher medizinisch abklären."},
  {id:"whey",name:"Whey-Protein",goals:["Muskelaufbau","Fettabbau"],benefit:"Praktische Proteinquelle, wenn die Ernährung den Bedarf nicht deckt.",evidence:"Gut belegt für die Deckung des Proteinbedarfs.",caution:"Milchprotein; Unverträglichkeiten und Allergien beachten."},
  {id:"casein",name:"Casein",goals:["Muskelaufbau"],benefit:"Langsam verdauliche Proteinquelle.",evidence:"Proteinversorgung ist wichtiger als der genaue Zeitpunkt.",caution:"Enthält Milchprotein."},
  {id:"vegan",name:"Veganes Proteinpulver",goals:["Muskelaufbau","Fettabbau"],benefit:"Ergänzt die Proteinzufuhr bei pflanzlicher Ernährung.",evidence:"Gut geeignet bei ausreichender Menge und Aminosäurequalität.",caution:"Zutaten und Allergene prüfen."},
  {id:"caffeine",name:"Koffein",goals:["Ausdauer","Muskelaufbau"],benefit:"Kann Aufmerksamkeit und Trainingsleistung kurzfristig verbessern.",evidence:"Gut untersucht.",caution:"Kann Schlaf, Puls und Angstgefühle beeinflussen; besonders bei Herzproblemen vorsichtig."},
  {id:"betaalanine",name:"Beta-Alanin",goals:["Ausdauer"],benefit:"Kann bei wiederholten intensiven Belastungen helfen.",evidence:"Mäßig bis gut für bestimmte Belastungsdauern.",caution:"Kann harmloses Kribbeln verursachen."},
  {id:"beetroot",name:"Rote-Bete-Saft / Nitrat",goals:["Ausdauer"],benefit:"Kann die Ausdauerleistung in bestimmten Situationen unterstützen.",evidence:"Gemischte bis mäßige Evidenz.",caution:"Bei Blutdruckmedikamenten Rücksprache halten."},
  {id:"electrolytes",name:"Elektrolyte",goals:["Ausdauer","Regeneration"],benefit:"Können bei langem Training und starkem Schwitzen sinnvoll sein.",evidence:"Situationsabhängig sinnvoll.",caution:"Natriumgehalt und Erkrankungen beachten."},
  {id:"carbs",name:"Kohlenhydratpulver",goals:["Ausdauer","Regeneration"],benefit:"Liefert Energie bei langen Einheiten.",evidence:"Gut belegt bei längeren Belastungen.",caution:"Nicht für jedes kurze Training erforderlich."},
  {id:"omega3",name:"Omega-3 (EPA/DHA)",goals:["Gesundheit"],benefit:"Ergänzt die Zufuhr mariner Omega-3-Fettsäuren.",evidence:"Nutzen hängt von Ernährung und Indikation ab.",caution:"Bei Blutverdünnern und vor Operationen ärztlich abklären."},
  {id:"vitd",name:"Vitamin D",goals:["Gesundheit"],benefit:"Wichtig für Knochen und normale Muskelfunktion.",evidence:"Ergänzung besonders bei nachgewiesenem Mangel sinnvoll.",caution:"Überdosierung möglich; keine Hochdosis ohne Abklärung."},
  {id:"magnesium",name:"Magnesium",goals:["Gesundheit","Regeneration"],benefit:"Trägt zur normalen Muskel- und Nervenfunktion bei.",evidence:"Zusatznutzen vor allem bei unzureichender Versorgung.",caution:"Hohe Mengen können Durchfall verursachen; bei Nierenerkrankung vorsichtig."},
  {id:"zinc",name:"Zink",goals:["Gesundheit"],benefit:"Wichtig für Immunsystem und Stoffwechsel.",evidence:"Vor allem bei Mangel relevant.",caution:"Langfristig hohe Mengen können Kupfermangel auslösen."},
  {id:"iron",name:"Eisen",goals:["Gesundheit","Ausdauer"],benefit:"Relevant für Sauerstofftransport bei Eisenmangel.",evidence:"Bei diagnostiziertem Mangel wirksam.",caution:"Nur nach Blutwerten bzw. medizinischer Empfehlung einnehmen."},
  {id:"b12",name:"Vitamin B12",goals:["Gesundheit"],benefit:"Wichtig für Nerven und Blutbildung; besonders relevant bei veganer Ernährung.",evidence:"Gut belegt zur Vermeidung/Behandlung eines Mangels.",caution:"Ursachen eines Mangels medizinisch abklären."},
  {id:"folate",name:"Folat",goals:["Gesundheit"],benefit:"Wichtig für Zellteilung und Blutbildung.",evidence:"Gut belegt bei unzureichender Versorgung.",caution:"Hohe Mengen können einen B12-Mangel verdecken."},
  {id:"calcium",name:"Calcium",goals:["Gesundheit"],benefit:"Wichtig für Knochen und Muskeln.",evidence:"Sinnvoll bei zu geringer Zufuhr.",caution:"Nicht unnötig hoch dosieren; Wechselwirkungen beachten."},
  {id:"fiber",name:"Flohsamenschalen",goals:["Gesundheit","Fettabbau"],benefit:"Ballaststoffquelle für Verdauung und Sättigung.",evidence:"Gut untersucht für Verdauung und bestimmte Blutfettwerte.",caution:"Mit ausreichend Wasser einnehmen; Abstand zu Medikamenten beachten."},
  {id:"probiotic",name:"Probiotika",goals:["Gesundheit"],benefit:"Einzelne Stämme können bei bestimmten Verdauungsproblemen helfen.",evidence:"Stamm- und indikationsabhängig.",caution:"Bei Immunsuppression vorher ärztlich abklären."},
  {id:"collagen",name:"Kollagenpeptide",goals:["Regeneration"],benefit:"Wird für Bindegewebe und Gelenke untersucht.",evidence:"Begrenzt und uneinheitlich.",caution:"Kein Ersatz für Training, Reha oder ausreichendes Gesamtprotein."},
  {id:"glucosamine",name:"Glucosamin",goals:["Regeneration"],benefit:"Wird bei Gelenkbeschwerden eingesetzt.",evidence:"Uneinheitlich; kein gesicherter Nutzen für Sportregeneration.",caution:"Wechselwirkungen, insbesondere mit Gerinnungshemmern, beachten."},
  {id:"melatonin",name:"Melatonin",goals:["Regeneration"],benefit:"Kann bei bestimmten Schlafrhythmusproblemen helfen.",evidence:"Für einzelne Schlafindikationen belegt.",caution:"Müdigkeit und Wechselwirkungen möglich; nicht pauschal empfohlen."},
  {id:"multivitamin",name:"Multivitamin",goals:["Gesundheit"],benefit:"Kann Versorgungslücken in speziellen Situationen abdecken.",evidence:"Kein allgemeiner Leistungsbonus bei guter Ernährung belegt.",caution:"Doppelte Aufnahme mehrerer Vitamine vermeiden."},
  {id:"eaa",name:"Essenzielle Aminosäuren (EAA)",goals:["Muskelaufbau"],benefit:"Liefern essenzielle Aminosäuren.",evidence:"Bei ausreichendem Gesamtprotein meist nicht zusätzlich nötig.",caution:"Kein Ersatz für eine ausgewogene Ernährung."},
  {id:"bcaa",name:"BCAA",goals:["Muskelaufbau"],benefit:"Drei verzweigtkettige Aminosäuren.",evidence:"Zusatznutzen bei ausreichendem Protein wenig überzeugend.",caution:"Vollständige Proteinquellen sind meist sinnvoller."}
];
const GOALS: Goal[] = ["Alle","Muskelaufbau","Fettabbau","Regeneration","Ausdauer","Gesundheit"];

const EMPTY = (): DayData => ({
  steps: 0, waterMl: 0, sleepMinutes: 0, note: "",
  meals: [], supplements: [],
});
const MEAL_TYPES: MealType[] = ["Frühstück", "Mittagessen", "Abendessen", "Snacks"];
const STEPS_GOAL = 10000;
const WATER_GOAL = 2500;
const SLEEP_GOAL = 480;
const fieldClass = "min-w-0 w-full rounded-xl border border-white/20 bg-transparent p-3";
function localDate() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function shiftDate(day: string, offset: number) {
  const d = new Date(`${day}T12:00:00`);
  d.setDate(d.getDate() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function percent(value: number, goal: number) {
  return Math.min(100, Math.max(0, Math.round((value / goal) * 100)));
}
function safeNumber(value: unknown, max = 1000000) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.min(max, Math.max(0, n)) : 0;
}
function normalize(raw: unknown): DayData {
  if (!raw || typeof raw !== "object") return EMPTY();
  const p = raw as Partial<DayData>;
  return {
    steps: safeNumber(p.steps, 200000),
    waterMl: safeNumber(p.waterMl, 100000),
    sleepMinutes: safeNumber(p.sleepMinutes, 1440),
    note: typeof p.note === "string" ? p.note : "",
    meals: Array.isArray(p.meals) ? p.meals.filter((x): x is Meal =>
      !!x && typeof x.id === "string" && typeof x.name === "string" &&
      MEAL_TYPES.includes(x.type)
    ).map(x => ({
      ...x, kcal: safeNumber(x.kcal), protein: safeNumber(x.protein),
      carbs: safeNumber(x.carbs), fat: safeNumber(x.fat),
    })) : [],
    supplements: Array.isArray(p.supplements) ? p.supplements.filter((x): x is Supplement =>
      !!x && typeof x.id === "string" && typeof x.name === "string"
    ).map(x => ({ ...x, taken: Boolean(x.taken) })) : [],
  };
}
function ProgressBar({ value, goal, label }: { value: number; goal: number; label: string }) {
  const pct = percent(value, goal);
  return (
    <div className="mt-2 h-3 overflow-hidden rounded-full bg-white/10"
      role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
      <div className="h-full rounded-full bg-accent transition-all duration-500" style={{ width: `${pct}%` }} />
    </div>
  );
}
function sum(meals: Meal[], field: "kcal" | "protein" | "carbs" | "fat") {
  return meals.reduce((total, meal) => total + meal[field], 0);
}
function format(n: number) {
  return n.toLocaleString("de-DE", { maximumFractionDigits: 1 });
}

type Food = { name: string; kcal: number; protein: number; carbs: number; fat: number };
const foodNum = (v: unknown) => typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : 0;

// Integrierte Basiswerte pro 100 g (ungefähre Durchschnittswerte, keine Markenangaben).
// Funktioniert auch, wenn der externe Produktdienst nicht erreichbar ist.
const BASIC_FOODS: Food[] = [
  ["Banane",89,1.1,22.8,0.3],["Apfel",52,0.3,13.8,0.2],
  ["Erdbeeren",32,0.7,7.7,0.3],["Blaubeeren",57,0.7,14.5,0.3],
  ["Haferflocken",372,13.5,58.7,7],["Reis, gekocht",130,2.7,28.2,0.3],
  ["Reis, trocken",350,7,77,0.7],["Nudeln, gekocht",158,5.8,30.9,0.9],
  ["Nudeln, trocken",350,12,71,1.5],["Kartoffeln, gekocht",87,1.9,20.1,0.1],
  ["Vollkornbrot",230,8.5,41,3.5],["Toastbrot",265,9,49,3.2],
  ["Hähnchenbrust, gegart",165,31,0,3.6],["Putenbrust, gegart",135,29,0,1.6],
  ["Rinderhack, 5 % Fett, roh",137,21,0,5],["Lachs, roh",208,20,0,13],
  ["Thunfisch im eigenen Saft",116,26,0,1],["Ei, ganz",143,12.6,0.7,9.5],
  ["Eiklar",52,11,0.7,0.2],["Magerquark",67,12,4,0.2],
  ["Skyr natur",63,11,4,0.2],["Griechischer Joghurt, 10 %",133,5,3.8,10],
  ["Naturjoghurt, 1,5 %",47,3.5,4.7,1.5],["Milch, 1,5 %",47,3.4,4.9,1.5],
  ["Whey Protein Pulver (Richtwert)",390,78,8,6],["Mandeln",579,21,22,50],
  ["Walnüsse",654,15,14,65],["Erdnussbutter",588,25,20,50],
  ["Olivenöl",884,0,0,100],["Butter",717,0.9,0.1,81],
  ["Avocado",160,2,8.5,14.7],["Brokkoli",34,2.8,6.6,0.4],
  ["Tomate",18,0.9,3.9,0.2],["Gurke",15,0.7,3.6,0.1],
  ["Karotte",41,0.9,9.6,0.2],["Kidneybohnen, gekocht",127,8.7,22.8,0.5],
  ["Kichererbsen, gekocht",164,8.9,27.4,2.6],["Tofu natur",120,13,2,7],
  ["Mozzarella",280,22,2.2,21],["Gouda",356,25,2.2,27],
  ["Honig",304,0.3,82.4,0],["Zucker",400,0,100,0]
].map(([name,kcal,protein,carbs,fat]) => ({name: String(name),kcal: Number(kcal),protein: Number(protein),carbs: Number(carbs),fat: Number(fat)}));
const matchFood = (name: string, query: string) => name.toLocaleLowerCase("de").includes(query.toLocaleLowerCase("de"));

export default function HealthPage() {
  const { user, profile } = useProfile({ requireOnboarding: true });
  const [sex, setSex] = useState<"male" | "female">("male");
  const [activity, setActivity] = useState("1.375");
  const [goalMode, setGoalMode] = useState<"lose" | "maintain" | "gain">("maintain");
  const [creditSteps, setCreditSteps] = useState(false);
  const [foodQuery, setFoodQuery] = useState("");
  const [foodResults, setFoodResults] = useState<Food[]>([]);
  const [foodLoading, setFoodLoading] = useState(false);
  const [foodError, setFoodError] = useState("");
  const [chosenFood, setChosenFood] = useState<Food | null>(null);
  const [foodGrams, setFoodGrams] = useState("100");
  const [customTarget, setCustomTarget] = useState<number | null>(null);
  useEffect(() => {
    try {
      const settings = JSON.parse(localStorage.getItem("bodyquest-nutrition-settings") || "{}");
      if (settings.sex === "male" || settings.sex === "female") setSex(settings.sex);
      if (["1.2","1.375","1.55","1.725"].includes(settings.activity)) setActivity(settings.activity);
      if (["lose","maintain","gain"].includes(settings.goalMode)) setGoalMode(settings.goalMode);
      setCreditSteps(settings.creditSteps === true);
    } catch { /* default settings */ }
  }, []);
  useEffect(() => {
    localStorage.setItem("bodyquest-nutrition-settings", JSON.stringify({sex,activity,goalMode,creditSteps}));
  }, [sex,activity,goalMode,creditSteps]);
  useEffect(() => { setCustomTarget(null); }, [profile?.calorie_target]);
  async function saveCalorieTarget() {
    if (!user || !hasBodyData || suggested < 1000 || suggested > 6000) {
      setMessage("Bitte zuerst Alter, Größe und Gewicht im Profil ergänzen."); return;
    }
    const { error } = await getSupabase().from("profiles").update({ calorie_target: suggested }).eq("id", user.id);
    if (error) setMessage(`Kalorienziel konnte nicht gespeichert werden: ${error.message}`);
    else { setCustomTarget(suggested); setMessage("Kalorienziel im Profil gespeichert."); }
  }
  async function searchFoods() {
    const query = foodQuery.trim();
    if (query.length < 2) { setFoodError("Bitte mindestens zwei Zeichen eingeben."); return; }
    setFoodLoading(true); setFoodError(""); setChosenFood(null);
    const local = BASIC_FOODS.filter(f => matchFood(f.name, query));
    // Sofortige Treffer aus der integrierten Datenbank, unabhängig vom Netzwerk.
    setFoodResults(local);
    try {
      // Open Food Facts ergänzt die lokalen Grundnahrungsmittel um Markenprodukte.
      const url = "https://world.openfoodfacts.org/cgi/search.pl?search_terms=" + encodeURIComponent(query) +
        "&search_simple=1&action=process&json=1&page_size=25&fields=product_name,brands,nutriments";
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6500);
      let response: Response;
      try { response = await fetch(url, { signal: controller.signal }); }
      finally { clearTimeout(timeout); }
      if (!response.ok) throw new Error("Produktdatenbank nicht erreichbar");
      const json = await response.json();
      const online: Food[] = (Array.isArray(json.products) ? json.products : []).flatMap((p: {
        product_name?: string; brands?: string; nutriments?: Record<string, unknown>
      }) => {
        const n = p.nutriments || {};
        const kcal = Number(n["energy-kcal_100g"]);
        if (!p.product_name || !Number.isFinite(kcal) || kcal <= 0) return [];
        return [{
          name: String(p.product_name) + (p.brands ? " · " + String(p.brands) : ""),
          kcal, protein: foodNum(n["proteins_100g"]), carbs: foodNum(n["carbohydrates_100g"]),
          fat: foodNum(n["fat_100g"])
        }];
      });
      const unique = new Map<string, Food>();
      [...local, ...online].forEach(f => unique.set(f.name.toLocaleLowerCase("de"), f));
      setFoodResults([...unique.values()]);
      if (!unique.size) setFoodError("Keine passenden Lebensmittel gefunden. Du kannst die Mahlzeit manuell eintragen.");
    } catch {
      setFoodError(local.length
        ? "Markenprodukte derzeit nicht erreichbar. Die integrierten Lebensmittel kannst du trotzdem auswählen."
        : "Keine lokalen Treffer und Online-Suche nicht erreichbar. Bitte manuell eintragen.");
    } finally { setFoodLoading(false); }
  }
  function useFood() {
    const grams = Number(foodGrams.replace(",", "."));
    if (!chosenFood || !Number.isFinite(grams) || grams <= 0 || grams > 5000) {
      setMessage("Bitte eine gültige Menge zwischen 1 und 5000 g eingeben."); return;
    }
    const factor = grams / 100;
    setMealName(chosenFood.name.slice(0,120)); setMealAmount(`${grams} g`);
    setMealKcal(String(Math.round(chosenFood.kcal * factor * 10) / 10));
    setMealProtein(String(Math.round(chosenFood.protein * factor * 10) / 10));
    setMealCarbs(String(Math.round(chosenFood.carbs * factor * 10) / 10));
    setMealFat(String(Math.round(chosenFood.fat * factor * 10) / 10));
    setMessage("Nährwerte übernommen. Bitte prüfen und unten Mahlzeit speichern.");
  }

  const [date, setDate] = useState("");
  const [data, setData] = useState<DayData>(EMPTY);
  const [stepsInput, setStepsInput] = useState("");
  const [sleepHours, setSleepHours] = useState("");
  const [sleepMins, setSleepMins] = useState("");
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState("");
  const [mealType, setMealType] = useState<MealType>("Frühstück");
  const [mealName, setMealName] = useState("");
  const [mealAmount, setMealAmount] = useState("");
  const [mealKcal, setMealKcal] = useState("");
  const [mealProtein, setMealProtein] = useState("");
  const [mealCarbs, setMealCarbs] = useState("");
  const [mealFat, setMealFat] = useState("");
  const [suppSearch, setSuppSearch] = useState("");
  const [suppGoal, setSuppGoal] = useState<Goal>("Alle");
  const [suppSelected, setSuppSelected] = useState<string | null>(null);
  const [suppName, setSuppName] = useState("");
  const [suppDose, setSuppDose] = useState("");
  const [suppTime, setSuppTime] = useState("");
  const weight = Number(profile?.weight_kg);
  const height = Number(profile?.height_cm);
  const age = Number(profile?.age);
  const hasBodyData = weight > 0 && height > 0 && age > 0;
  const bmr = hasBodyData ? 10 * weight + 6.25 * height - 5 * age + (sex === "male" ? 5 : -161) : 0;
  const maintenance = Math.round(bmr * Number(activity));
  const suggested = maintenance + (goalMode === "lose" ? -400 : goalMode === "gain" ? 250 : 0);
  const savedTarget = Number(profile?.calorie_target) > 0 ? Number(profile?.calorie_target) : 0;
  const dailyTarget = customTarget ?? savedTarget;
  // Only steps above the baseline are eligible, and only when explicitly enabled.
  const stepBonus = creditSteps ? Math.round(Math.max(0, data.steps - 6000) * 0.04) : 0;
  const eaten = sum(data.meals, "kcal");
  const remaining = dailyTarget + stepBonus - eaten;


  useEffect(() => { setDate(localDate()); }, []);
  useEffect(() => {
    if (!date) return;
    setReady(false);
    try {
      const stored = localStorage.getItem(`bodyquest-health:${date}`);
      setData(stored ? normalize(JSON.parse(stored)) : EMPTY());
      setMessage("");
    } catch {
      setData(EMPTY());
      setMessage("Gespeicherte Daten konnten nicht geladen werden.");
    }
    setStepsInput("");
    setSleepHours("");
    setSleepMins("");
    setReady(true);
  }, [date]);

  function save(next: DayData) {
    setData(next);
    try {
      localStorage.setItem(`bodyquest-health:${date}`, JSON.stringify(next));
      setMessage("Auf diesem Gerät gespeichert.");
    } catch {
      setMessage("Speichern fehlgeschlagen. Bitte Browser-Speicher prüfen.");
    }
  }
  function saveSteps() {
    const n = Number(stepsInput);
    if (!Number.isInteger(n) || n < 0 || n > 200000 || stepsInput.trim() === "") {
      setMessage("Bitte eine gültige Schrittzahl von 0 bis 200.000 eingeben.");
      return;
    }
    save({ ...data, steps: n });
    setStepsInput("");
  }
  function saveSleep() {
    const h = Number(sleepHours || "0");
    const m = Number(sleepMins || "0");
    if (!Number.isInteger(h) || !Number.isInteger(m) || h < 0 || h > 24 || m < 0 || m > 59 || h * 60 + m > 1440) {
      setMessage("Bitte eine gültige Schlafdauer eingeben.");
      return;
    }
    save({ ...data, sleepMinutes: h * 60 + m });
  }
  function addMeal() {
    if (!mealName.trim()) {
      setMessage("Bitte ein Lebensmittel oder Gericht eingeben.");
      return;
    }
    const raw = [mealKcal, mealProtein, mealCarbs, mealFat];
    if (raw.some(x => x.trim() === "" || !Number.isFinite(Number(x)) || Number(x) < 0 || Number(x) > 100000)) {
      setMessage("Bitte gültige Kalorien und Makros eingeben (auch 0 ist erlaubt).");
      return;
    }
    const meal: Meal = {
      id: crypto.randomUUID(), type: mealType, name: mealName.trim(),
      amount: mealAmount.trim(), kcal: Number(mealKcal),
      protein: Number(mealProtein), carbs: Number(mealCarbs), fat: Number(mealFat),
    };
    save({ ...data, meals: [...data.meals, meal] });
    setMealName(""); setMealAmount(""); setMealKcal("");
    setMealProtein(""); setMealCarbs(""); setMealFat("");
  }
  const matchingSupplements = CATALOG.filter(s =>
    (suppGoal === "Alle" || s.goals.includes(suppGoal)) &&
    `${s.name} ${s.benefit}`.toLocaleLowerCase("de").includes(suppSearch.toLocaleLowerCase("de"))
  );
  function selectSupplement(item: (typeof CATALOG)[number]) {
    setSuppSelected(item.id);
    setSuppName(item.name);
    setMessage(`${item.name} ausgewählt. Angaben prüfen und unten hinzufügen.`);
  }
  function addSupplement() {
    if (!suppName.trim()) {
      setMessage("Bitte den Namen des Supplements eingeben.");
      return;
    }
    save({
      ...data,
      supplements: [...data.supplements, {
        id: crypto.randomUUID(), name: suppName.trim(),
        dose: suppDose.trim(), time: suppTime, taken: false,
      }],
    });
    setSuppName(""); setSuppDose(""); setSuppTime(""); setSuppSelected(null);
  }

  if (!ready) return <p className="text-muted">Health wird geladen...</p>;
  return (
    <main className="grid gap-5">
      <header className="grid gap-2">
        <h1 className="font-display text-3xl font-bold">BodyQuest Health</h1>
        <p className="text-muted">Dein persönliches Fitness-Tagebuch – ohne XP und Nachweispflicht.</p>
        <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 p-2">
          <button type="button" className="btn-ghost" aria-label="Vorheriger Tag" onClick={() => setDate(shiftDate(date, -1))}><ChevronLeft /></button>
          <label className="text-sm font-semibold">
            <span className="sr-only">Tagebuchdatum</span>
            <input type="date" value={date} max={localDate()} onChange={e => { if (e.target.value) setDate(e.target.value); }}
              className="max-w-[160px] bg-transparent text-center" />
          </label>
          <button type="button" className="btn-ghost" aria-label="Nächster Tag"
            disabled={date >= localDate()} onClick={() => setDate(shiftDate(date, 1))}><ChevronRight /></button>
        </div>
      </header>
      {message && <p role="status" className="text-sm text-accent">{message}</p>}

      <section className="card grid gap-3">
        <h2 className="flex items-center gap-2 text-xl font-semibold"><Calculator className="text-accent" /> Kaloriencoach</h2>
        <p className="text-sm text-muted">Dein Tagesbudget aus Profilziel, Mahlzeiten und optional zusätzlichen Schritten.</p>
        {dailyTarget > 0 ? (
          <div className="rounded-xl bg-white/5 p-4">
            <p className="text-sm text-muted">Noch verfügbar</p>
            <p className={`text-3xl font-bold ${remaining < 0 ? "text-red-400" : "text-accent"}`}>{format(remaining)} kcal</p>
            <p className="text-sm text-muted">Ziel {format(dailyTarget)} − gegessen {format(eaten)} + Zusatzschritte {format(stepBonus)} kcal</p>
          </div>
        ) : <p className="text-sm text-yellow-300">Noch kein Kalorienziel gespeichert. Nutze den Rechner unten.</p>}
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={creditSteps} onChange={e => setCreditSteps(e.target.checked)} />
          Zusätzliche Schritte über 6.000 pro Tag anrechnen (Schätzung)
        </label>
        <p className="text-xs text-muted">0,04 kcal je zusätzlichem Schritt als grobe Schätzung. Standardmäßig aus, um Bewegung nicht doppelt zu zählen.</p>
        <details className="rounded-xl border border-white/10 p-3">
          <summary className="cursor-pointer font-semibold">Persönlichen Kalorienbedarf berechnen</summary>
          <div className="mt-3 grid gap-3">
            <p className="text-sm text-muted">Profildaten: {hasBodyData ? `${weight} kg · ${height} cm · ${age} Jahre` : "Gewicht, Größe oder Alter fehlen. Bitte im Profil ergänzen."}</p>
            <label className="grid gap-1 text-sm">Berechnungsgrundlage
              <select className={fieldClass} value={sex} onChange={e => setSex(e.target.value as "male" | "female")}>
                <option value="male">Männlich</option><option value="female">Weiblich</option>
              </select>
            </label>
            <label className="grid gap-1 text-sm">Aktivitätsniveau
              <select className={fieldClass} value={activity} onChange={e => setActivity(e.target.value)}>
                <option value="1.2">Überwiegend sitzend</option>
                <option value="1.375">Leicht aktiv</option>
                <option value="1.55">Moderat aktiv</option>
                <option value="1.725">Sehr aktiv</option>
              </select>
            </label>
            <label className="grid gap-1 text-sm">Ziel
              <select className={fieldClass} value={goalMode} onChange={e => setGoalMode(e.target.value as "lose" | "maintain" | "gain")}>
                <option value="lose">Abnehmen / Definieren</option>
                <option value="maintain">Gewicht halten</option>
                <option value="gain">Muskelaufbau</option>
              </select>
            </label>
            {hasBodyData && <p className="text-sm">Grundumsatz: {format(Math.round(bmr))} kcal · Erhaltung: {format(maintenance)} kcal<br/><strong>Vorschlag: {format(suggested)} kcal / Tag</strong></p>}
            <button type="button" className="btn-primary" disabled={!hasBodyData} onClick={saveCalorieTarget}>Vorgeschlagenes Kalorienziel speichern</button>
            <p className="text-xs text-muted">Mifflin-St-Jeor-Schätzung. Passe dein Ziel anhand des Gewichtsverlaufs an. Aktivitätsfaktor und Schrittbonus können sich überschneiden.</p>
          </div>
        </details>
      </section>

      <section className="card grid gap-3">
        <h2 className="flex items-center gap-2 text-xl font-semibold"><Footprints className="text-accent" /> Schritte</h2>
        <p className="text-2xl font-bold">{data.steps.toLocaleString("de-DE")} <span className="text-sm font-normal text-muted">/ {STEPS_GOAL.toLocaleString("de-DE")}</span></p>
        <ProgressBar value={data.steps} goal={STEPS_GOAL} label="Schrittziel" />
        <div className="flex gap-2">
          <input className={fieldClass} aria-label="Schritte" type="number" min={0} max={200000}
            inputMode="numeric" placeholder="Schritte" value={stepsInput} onChange={e => setStepsInput(e.target.value)} />
          <button className="btn-primary" type="button" onClick={saveSteps}>Speichern</button>
        </div>
      </section>

      <section className="card grid gap-3">
        <h2 className="flex items-center gap-2 text-xl font-semibold"><Droplets className="text-accent" /> Wasser</h2>
        <p className="text-2xl font-bold">{format(data.waterMl / 1000)} L <span className="text-sm font-normal text-muted">/ {format(WATER_GOAL / 1000)} L</span></p>
        <ProgressBar value={data.waterMl} goal={WATER_GOAL} label="Trinkziel" />
        <div className="flex flex-wrap gap-2">
          {[150, 250, 500].map(ml => (
            <button key={ml} type="button" className="btn-ghost"
              onClick={() => save({ ...data, waterMl: Math.min(100000, data.waterMl + ml) })}>+{ml} ml</button>
          ))}
          <button type="button" className="btn-ghost" disabled={data.waterMl === 0}
            onClick={() => save({ ...data, waterMl: Math.max(0, data.waterMl - 250) })}>−250 ml</button>
        </div>
      </section>

      <section className="card grid gap-3">
        <h2 className="flex items-center gap-2 text-xl font-semibold"><Moon className="text-accent" /> Schlaf</h2>
        <p className="text-2xl font-bold">{Math.floor(data.sleepMinutes / 60)} h {data.sleepMinutes % 60} min <span className="text-sm font-normal text-muted">/ 8 h</span></p>
        <ProgressBar value={data.sleepMinutes} goal={SLEEP_GOAL} label="Schlafziel" />
        <div className="flex flex-wrap items-center gap-2">
          <input className="w-24 rounded-xl border border-white/20 bg-transparent p-3" aria-label="Stunden Schlaf"
            type="number" min={0} max={24} placeholder="Stunden" value={sleepHours} onChange={e => setSleepHours(e.target.value)} />
          <input className="w-24 rounded-xl border border-white/20 bg-transparent p-3" aria-label="Minuten Schlaf"
            type="number" min={0} max={59} placeholder="Minuten" value={sleepMins} onChange={e => setSleepMins(e.target.value)} />
          <button type="button" className="btn-primary" onClick={saveSleep}>Speichern</button>
        </div>
      </section>

      <section className="card grid gap-4">
        <h2 className="flex items-center gap-2 text-xl font-semibold"><Utensils className="text-accent" /> Ernährung</h2>
        <div className="grid grid-cols-2 gap-2">
          {([
            ["Kalorien", "kcal", sum(data.meals, "kcal")],
            ["Protein", "g", sum(data.meals, "protein")],
            ["Kohlenhydrate", "g", sum(data.meals, "carbs")],
            ["Fett", "g", sum(data.meals, "fat")],
          ] as const).map(([label, unit, value]) => (
            <div key={label} className="rounded-xl bg-white/5 p-3">
              <p className="text-xs text-muted">{label}</p>
              <p className="text-xl font-bold">{format(value)} <span className="text-xs font-normal text-muted">{unit}</span></p>
            </div>
          ))}
        </div>
        <div className="grid gap-2 rounded-xl border border-white/10 p-3">
          <h3 className="flex items-center gap-2 font-semibold"><Search size={18} /> Lebensmittel suchen</h3>
          <div className="flex gap-2">
            <input className={fieldClass} value={foodQuery} onChange={e => setFoodQuery(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") void searchFoods(); }} placeholder="z. B. Skyr, Haferflocken ..." />
            <button type="button" className="btn-primary" disabled={foodLoading} onClick={searchFoods}>{foodLoading ? "Suche..." : "Suchen"}</button>
          </div>
          {foodError && <p className="text-sm text-yellow-300">{foodError}</p>}
          <p className="text-xs text-muted">Grundnahrungsmittel sind integriert. Markenprodukte werden zusätzlich online gesucht. Nährwerte bitte prüfen.</p>\n          {foodResults.length > 0 && <select className={fieldClass} value={chosenFood ? String(foodResults.indexOf(chosenFood)) : ""}
            onChange={e => setChosenFood(foodResults[Number(e.target.value)] || null)}>
            <option value="">Lebensmittel auswählen</option>
            {foodResults.map((f,i) => <option key={i} value={i}>{f.name.slice(0,70)} · {format(f.kcal)} kcal/100 g</option>)}
          </select>}
          {chosenFood && <>
            <label className="grid gap-1 text-sm">Menge (g)
              <input className={fieldClass} type="number" min="1" max="5000" value={foodGrams} onChange={e => setFoodGrams(e.target.value)} />
            </label>
            <p className="text-sm text-muted">Berechnet: {format(chosenFood.kcal * Number(foodGrams || 0) / 100)} kcal · Protein {format(chosenFood.protein * Number(foodGrams || 0) / 100)} g</p>
            <button type="button" className="btn-primary" onClick={useFood}>Nährwerte in Mahlzeit übernehmen</button>
          </>}
          <p className="text-xs text-muted">Produktdaten: Open Food Facts (Community-Daten, Angaben prüfen). Suche benötigt Internet; alternativ manuell eintragen.</p>
        </div>
        {MEAL_TYPES.map(type => (
          <div key={type} className="grid gap-2 border-t border-white/10 pt-3">
            <h3 className="font-semibold">{type}</h3>
            {data.meals.filter(m => m.type === type).length === 0 && <p className="text-sm text-muted">Noch nichts eingetragen.</p>}
            {data.meals.filter(m => m.type === type).map(meal => (
              <div key={meal.id} className="flex items-start justify-between gap-2 rounded-xl bg-white/5 p-3">
                <div className="min-w-0">
                  <p className="font-semibold break-words">{meal.name}{meal.amount ? ` · ${meal.amount}` : ""}</p>
                  <p className="text-xs text-muted">{format(meal.kcal)} kcal · P {format(meal.protein)} g · KH {format(meal.carbs)} g · F {format(meal.fat)} g</p>
                </div>
                <button type="button" aria-label={`${meal.name} löschen`} className="text-muted"
                  onClick={() => save({ ...data, meals: data.meals.filter(m => m.id !== meal.id) })}><Trash2 size={18} /></button>
              </div>
            ))}
          </div>
        ))}
        <div className="grid gap-2 border-t border-white/10 pt-3">
          <h3 className="flex items-center gap-2 font-semibold"><Plus size={18} /> Mahlzeit hinzufügen</h3>
          <select aria-label="Mahlzeit" className={fieldClass} value={mealType} onChange={e => setMealType(e.target.value as MealType)}>
            {MEAL_TYPES.map(type => <option key={type} value={type} className="bg-zinc-900">{type}</option>)}
          </select>
          <input className={fieldClass} aria-label="Lebensmittel" placeholder="Lebensmittel / Gericht" maxLength={120}
            value={mealName} onChange={e => setMealName(e.target.value)} />
          <input className={fieldClass} aria-label="Menge" placeholder="Menge, z. B. 200 g (optional)" maxLength={60}
            value={mealAmount} onChange={e => setMealAmount(e.target.value)} />
          <div className="grid grid-cols-2 gap-2">
            {([
              ["Kalorien (kcal)", mealKcal, setMealKcal],
              ["Protein (g)", mealProtein, setMealProtein],
              ["Kohlenhydrate (g)", mealCarbs, setMealCarbs],
              ["Fett (g)", mealFat, setMealFat],
            ] as const).map(([label, value, setter]) => (
              <label key={label} className="grid gap-1 text-xs text-muted">
                {label}
                <input className={fieldClass} type="number" min={0} max={100000} step="any" inputMode="decimal"
                  value={value} onChange={e => setter(e.target.value)} placeholder="0" />
              </label>
            ))}
          </div>
          <button type="button" className="btn-primary" onClick={addMeal}>Mahlzeit speichern</button>
        </div>
      </section>

      <section className="card grid gap-3">
        <h2 className="flex items-center gap-2 text-xl font-semibold"><Pill className="text-accent" /> Supplements</h2>
        {data.supplements.length === 0 && <p className="text-sm text-muted">Noch keine Supplements für diesen Tag.</p>}
        {data.supplements.map(s => (
          <div key={s.id} className="flex items-center gap-3 rounded-xl bg-white/5 p-3">
            <input type="checkbox" className="h-5 w-5 accent-lime-400" checked={s.taken}
              aria-label={`${s.name} eingenommen`} onChange={e => save({
                ...data, supplements: data.supplements.map(x => x.id === s.id ? { ...x, taken: e.target.checked } : x),
              })} />
            <div className="min-w-0 flex-1">
              <p className="font-semibold break-words">{s.name}</p>
              <p className="text-xs text-muted">{[s.dose, s.time].filter(Boolean).join(" · ") || "Keine Angaben"}</p>
            </div>
            <button type="button" aria-label={`${s.name} löschen`} className="text-muted"
              onClick={() => save({ ...data, supplements: data.supplements.filter(x => x.id !== s.id) })}><Trash2 size={18} /></button>
          </div>
        ))}
        <div className="grid gap-3 rounded-xl border border-white/10 p-3">
          <h3 className="flex items-center gap-2 font-semibold"><Search size={18} /> Supplement-Finder</h3>
          <p className="text-sm text-muted">Finde passende Supplements nach deinem Trainingsziel. Die Vorschläge sind allgemeine Informationen, keine persönliche medizinische Empfehlung.</p>
          <input className={fieldClass} aria-label="Supplements suchen"
            placeholder="Kreatin, Whey, Omega-3 ..." value={suppSearch}
            onChange={e => setSuppSearch(e.target.value)} />
          <select className={fieldClass} aria-label="Supplement-Ziel" value={suppGoal}
            onChange={e => setSuppGoal(e.target.value as Goal)}>
            {GOALS.map(g => <option key={g} value={g} className="bg-zinc-900">{g}</option>)}
          </select>
          <p className="text-xs text-muted">{matchingSupplements.length} Treffer aus 25 Einträgen · Kostenlose Wissensdatenbank, keine Live-KI.</p>
          <div className="grid max-h-80 gap-2 overflow-y-auto">
            {matchingSupplements.map(item => (
              <div key={item.id} className="grid gap-2 rounded-xl bg-white/5 p-3">
                <p className="font-semibold">{item.name}</p>
                <p className="text-sm text-muted">{item.benefit}</p>
                <p className="text-xs text-muted"><strong>Evidenz:</strong> {item.evidence}</p>
                <p className="text-xs text-yellow-300"><strong>Hinweis:</strong> {item.caution}</p>
                <button type="button" className="btn-ghost" onClick={() => selectSupplement(item)}>
                  {suppSelected === item.id ? "✓ Ausgewählt" : "In Formular übernehmen"}
                </button>
              </div>
            ))}
            {matchingSupplements.length === 0 && <p className="text-sm text-muted">Keine Treffer. Du kannst unten manuell eintragen.</p>}
          </div>
        </div>
        <div className="grid gap-2 border-t border-white/10 pt-3">
          <input className={fieldClass} aria-label="Supplementname" placeholder="Name, z. B. Kreatin" maxLength={100}
            value={suppName} onChange={e => setSuppName(e.target.value)} />
          <input className={fieldClass} aria-label="Dosierung" placeholder="Dosierung, z. B. 5 g (optional)" maxLength={60}
            value={suppDose} onChange={e => setSuppDose(e.target.value)} />
          <input className={fieldClass} aria-label="Einnahmezeit" type="time" value={suppTime} onChange={e => setSuppTime(e.target.value)} />
          <button type="button" className="btn-primary" onClick={addSupplement}>Supplement hinzufügen</button>
        </div>
        <p className="text-xs text-muted">Nur Dokumentation deiner Einnahme, keine Dosierungsempfehlung.</p>
      </section>

      <section className="card grid gap-3">
        <h2 className="flex items-center gap-2 text-xl font-semibold"><NotebookPen className="text-accent" /> Meine Notizen</h2>
        <textarea className="min-h-28 w-full rounded-xl border border-white/20 bg-transparent p-3"
          aria-label="Tagesnotiz" maxLength={2000} placeholder="Wie lief dein Tag? Training, Ernährung, Motivation ..."
          value={data.note} onChange={e => setData(old => ({ ...old, note: e.target.value }))} />
        <button className="btn-primary flex items-center justify-center gap-2" type="button"
          onClick={() => save(data)}><Save size={18} /> Notiz speichern</button>
      </section>
      <p className="text-xs text-muted">
        Beta: Alle Einträge werden nur im Browser dieses Geräts gespeichert, nicht in Supabase.
        Browserdaten löschen oder Gerät wechseln kann Einträge verlieren. Keine automatische Synchronisierung,
        Tracker-Verbindung, Push-Erinnerung oder XP-Vergabe.
      </p>
    </main>
  );
}