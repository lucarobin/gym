// Starting values. Everything here can be changed in the app under Settings.
// Targets come from the Bulking Plan (Oct 14, 2026). Food values are typical
// generic values per serving; swap in your packaging labels.
window.DEFAULTS = {
  targets: { kcal: 3400, kcalPerKm: 60, protein: 130, carbs: 500, fat: 75 },
  foods: [
    { name: "Bulk shake", serving: "1 shake", kcal: 1035, protein: 60, carbs: 114, fat: 41 },
    { name: "Egg", serving: "1 large", kcal: 72, protein: 6.3, carbs: 0.4, fat: 4.8 },
    { name: "Bread (wholegrain)", serving: "1 slice, 40 g", kcal: 100, protein: 4, carbs: 18, fat: 1.3 },
    { name: "Butter", serving: "10 g", kcal: 72, protein: 0.1, carbs: 0, fat: 8.1 },
    { name: "Rice (cooked)", serving: "100 g", kcal: 130, protein: 2.7, carbs: 28, fat: 0.3 },
    { name: "Pasta (cooked)", serving: "100 g", kcal: 158, protein: 5.8, carbs: 31, fat: 0.9 },
    { name: "Chicken breast (cooked)", serving: "100 g", kcal: 165, protein: 31, carbs: 0, fat: 3.6 },
    { name: "Beef mince (cooked)", serving: "100 g", kcal: 250, protein: 26, carbs: 0, fat: 16 },
    { name: "Salmon (cooked)", serving: "100 g", kcal: 208, protein: 20, carbs: 0, fat: 13 },
    { name: "Skyr", serving: "100 g", kcal: 63, protein: 11, carbs: 4, fat: 0.2 },
    { name: "Magerquark", serving: "100 g", kcal: 67, protein: 12, carbs: 4, fat: 0.3 },
    { name: "Cottage cheese", serving: "100 g", kcal: 98, protein: 11, carbs: 3.4, fat: 4.3 },
    { name: "Cheese (hard)", serving: "30 g", kcal: 120, protein: 7.5, carbs: 0.4, fat: 10 },
    { name: "Granola", serving: "50 g", kcal: 225, protein: 5, carbs: 32, fat: 9 },
    { name: "Honey", serving: "1 tbsp", kcal: 64, protein: 0.1, carbs: 17, fat: 0 },
    { name: "Olive oil", serving: "1 tbsp", kcal: 119, protein: 0, carbs: 0, fat: 13.5 },
    { name: "Banana", serving: "1 medium", kcal: 105, protein: 1.3, carbs: 27, fat: 0.4 },
    { name: "Apple", serving: "1 medium", kcal: 95, protein: 0.5, carbs: 25, fat: 0.3 },
    { name: "Whole milk", serving: "250 ml", kcal: 160, protein: 8.5, carbs: 12, fat: 9 },
    { name: "Oats", serving: "80 g", kcal: 303, protein: 10.6, carbs: 53, fat: 5.5 },
    { name: "Peanut butter", serving: "2 tbsp", kcal: 190, protein: 7, carbs: 7, fat: 16 },
    { name: "Whey protein", serving: "1 scoop, 30 g", kcal: 120, protein: 24, carbs: 3, fat: 1.5 },
    { name: "Lentils (cooked)", serving: "100 g", kcal: 116, protein: 9, carbs: 20, fat: 0.4 },
    { name: "Mixed nuts", serving: "30 g", kcal: 180, protein: 5, carbs: 6, fat: 16 },
    { name: "Dried fruit", serving: "40 g", kcal: 120, protein: 1, carbs: 30, fat: 0.2 },
    { name: "Vegetables (mixed)", serving: "150 g", kcal: 50, protein: 2.5, carbs: 8, fat: 0.5 }
  ],
  // From the Upper and Lower sheets in gym-tracking.xlsx.
  exercises: [
    { name: "Chest Press", split: "Upper" },
    { name: "Arm Curl", split: "Upper" },
    { name: "Overhead", split: "Upper" },
    { name: "Pulldown", split: "Upper" },
    { name: "Row", split: "Upper" },
    { name: "Cable (obe)", split: "Upper" },
    { name: "Cable (unde)", split: "Upper" },
    { name: "Fly", split: "Upper" },
    { name: "Hip outer", split: "Lower" },
    { name: "Hip inner", split: "Lower" },
    { name: "Leg Press", split: "Lower" },
    { name: "Leg Curl", split: "Lower" },
    { name: "Leg Extension", split: "Lower" }
  ],
  // 4-week plan from your table: weeks 1–2 start weight, weeks 3–4 target.
  // "best" is your best so far. Start date is set to the Monday of the week you first open the app.
  plan: {
    start: "",
    days: { Upper: 2, Lower: 2 },
    items: {
      "Chest Press":   { best: 47.3, w: [27, 27, 36, 36], sets: 3, reps: 10 },
      "Arm Curl":      { best: 36,   w: [22.5, 22.5, 27, 27], sets: 3, reps: 10 },
      "Overhead":      { best: 36,   w: [22.5, 22.5, 27, 27], sets: 3, reps: 10 },
      "Pulldown":      { best: 50,   w: [31.5, 31.5, 38.3, 38.3], sets: 3, reps: 10 },
      "Row":           { best: 60,   w: [36, 36, 45, 45], sets: 3, reps: 10 },
      "Cable (obe)":   { best: 17.5, w: [10, 12.5, 15, 15], sets: 3, reps: 10 },
      "Hip outer":     { best: 40,   w: [24.8, 24.8, 31.5, 31.5], sets: 3, reps: 10 },
      "Hip inner":     { best: 56.3, w: [33.8, 33.8, 42.8, 42.8], sets: 3, reps: 10 },
      "Leg Press":     { best: 76.5, w: [45, 47, 60, 60], sets: 3, reps: 10 },
      "Leg Curl":      { best: 54,   w: [31.5, 31.5, 40.5, 40.5], sets: 3, reps: 10 },
      "Leg Extension": { best: 60.8, w: [36, 36, 47.3, 47.3], sets: 3, reps: 10 }
    }
  },
  meals: ["Breakfast", "Lunch", "Snack", "Pre-workout", "Post-workout", "Dinner"]
};
