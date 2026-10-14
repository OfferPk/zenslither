# ZenSlither ➰✨

> A calm, meditative Slitherlink loop logic puzzle game.

[![CI](https://github.com/OfferPk/zenslither/actions/workflows/ci.yml/badge.svg)](https://github.com/OfferPk/zenslither/actions/workflows/ci.yml)
[![Android](https://github.com/OfferPk/zenslither/actions/workflows/android.yml/badge.svg)](https://github.com/OfferPk/zenslither/actions/workflows/android.yml)
[![Pages](https://github.com/OfferPk/zenslither/actions/workflows/pages.yml/badge.svg)](https://github.com/OfferPk/zenslither/actions/workflows/pages.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE)

**ZenSlither** is a serene, offline Japanese logic puzzle. Connect lattice pins with horizontal and vertical lines to weave a single continuous, non-intersecting loop guided by gentle numeric clues (0, 1, 2, 3).

---

## 🎮 Play Live
- **Web Demo**: [https://offerpk.github.io/zenslither/](https://offerpk.github.io/zenslither/)
- **Android APK**: Download the latest build from [GitHub Actions Artifacts](https://github.com/OfferPk/zenslither/actions/workflows/android.yml) (`zenslither-apk`).

---

## ✨ Features
- **50 Handcrafted & Solver-Verified Levels**: 5 progressive packs spanning 5x5 to 9x9 grids:
  - 🌿 *Meadow Loop* (5×5)
  - 🍃 *Willow Winding* (6×6)
  - 🎋 *Bamboo Lattice* (7×7)
  - 🌲 *Forest Fen* (8×8)
  - 🌌 *Mystic Maze* (9×9)
- **100% Uniquely Solvable**: Every level is mathematically verified by a constraint solver.
- **Procedural Silk & Koto Acoustics**: Pure Web Audio synthesizer featuring Japanese koto string plucks, dry bamboo ticks, clue harmony bells, and celebratory pentatonic victory arpeggios.
- **Intuitive Touch Controls**:
  - Tap edge to cycle: `Empty` ➔ `Line` ➔ `Cross (×)` ➔ `Empty`.
  - Drag along edges to trace lines smoothly.
  - Pin Auto-Cross: Automatically eliminates remaining incident edges when a pin connects 2 loop segments.
- **Smart Deduction Assistant**: Explains logic deductions (0-clue borders, satisfied clues, forced paths, pin continuations) with gentle animated edge highlights.
- **100% Offline & Private**: Zero tracking, zero ads, zero external network dependencies.
- **Mobile-First PWA & Android**: Installable web app or standalone native Android app via Capacitor.

---

## 📐 Rules of Slitherlink
1. Connect adjacent lattice pins with horizontal or vertical line segments.
2. The number inside each cell tells you exactly how many of its 4 edges are part of the loop.
3. Blank cells can have any number of edges.
4. All line segments must join together to form a **single, continuous closed loop** without branches or dead ends (every pin with lines has degree exactly 2).

---

## 🛠️ Development & Building

```bash
# Clone the repository
git clone https://github.com/OfferPk/zenslither.git
cd zenslither

# Install dependencies
npm ci

# Run unit tests
npm test

# Build web assets to www/
npm run build
```

### Android Build
```bash
# Sync with Capacitor
npx cap sync android

# Build debug APK
cd android && ./gradlew assembleDebug
```

---

## 📄 License
MIT License. Created by [OfferPk](https://github.com/OfferPk).
