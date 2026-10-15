# Gym Tracker

A simple phone app for logging meals, macros and workouts. It runs in the browser, works offline, and can be added to your home screen like a normal app.

## Open it

**https://lucarobin.github.io/gym/**

Add it to your home screen:
- **iPhone (Safari):** Share button → *Add to Home Screen*
- **Android (Chrome):** ⋮ menu → *Add to Home screen* / *Install app*

## How it works

- **Food:** tap **+ Food**, pick a food, set the servings, done. The top card shows calories left and your protein, carbs and fat against your targets. Enter the km you ran and the calorie target goes up by 60 kcal per km. Tap any entry to change or remove it.
- **Workout:** pick Upper or Lower, tap an exercise, adjust weight, sets and reps, and save. It remembers what you did last time, and if you marked **↑ Go up** it starts 2.5 kg heavier.
- **History:** calories for the last 14 days, and weight progress per exercise.
- **Settings:** change your targets, add or edit foods and exercises, and export a backup.

## Your data

Everything you log stays on your phone, in the browser's storage. Nothing is uploaded and nothing goes into this repo. Use **Settings → Export backup** now and then; you can import that file on another phone or browser.

Clearing your browser data for this site deletes your log, so keep a backup.

## Changing the defaults

Starting targets (from the Bulking Plan), foods and exercises are in [`data.js`](data.js). They are only used the first time the app opens; after that, change them in **Settings**.
