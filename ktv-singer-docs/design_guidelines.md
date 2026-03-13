# Karaoke Web Application - Design Guidelines

## Design Approach: Reference-Based (Entertainment Platform)

**Primary References**: Spotify (music browsing/search), YouTube (video player), Smule (karaoke performance), Netflix (content filtering)

**Core Philosophy**: Create an immersive, stage-like experience that balances entertainment excitement with functional clarity. The interface should feel like a modern digital karaoke lounge—sophisticated, engaging, and performance-focused.

---

## Color Palette

**Dark Mode Primary** (Stage/Performance Theme):
- Background Base: 12 8% 8% (deep charcoal, almost black)
- Surface: 240 10% 12% (slightly lighter panels)
- Elevated Surface: 240 8% 18% (cards, modals)

**Neon Accent System**:
- Primary Neon (Cyan): 180 100% 50% (active states, lyrics highlight)
- Secondary Neon (Magenta): 320 100% 65% (CTAs, scoring positive)
- Tertiary Neon (Purple): 270 80% 60% (decorative accents)

**Functional Colors**:
- Text Primary: 0 0% 95% (high contrast)
- Text Secondary: 240 5% 65% (metadata, labels)
- Text Muted: 240 5% 45% (disabled states)
- Success (Score): 142 76% 56% (performance feedback)
- Warning: 38 92% 50% (timing indicators)

---

## Typography

**Font Families**:
- Display/Headings: 'Inter' or 'Manrope' (700-800 weight) - modern, bold presence
- Body/Lyrics: 'DM Sans' or 'Plus Jakarta Sans' (400-600 weight) - excellent readability
- Monospace (Scores): 'JetBrains Mono' (500 weight) - technical precision

**Scale**:
- Song Titles: text-3xl md:text-4xl font-bold
- Lyrics (Active): text-4xl md:text-5xl font-semibold (dominant, readable from distance)
- Lyrics (Inactive): text-2xl md:text-3xl font-medium
- UI Labels: text-sm font-medium uppercase tracking-wide
- Metadata: text-xs text-muted

---

## Layout System

**Spacing Primitives**: Tailwind units of 4, 6, 8, 12, 16, 24 (consistent rhythm)

**Main Application Structure**:
```
┌─────────────────────────────────────────┐
│  Header (Search + Quick Actions)  h-16  │
├─────────────────────────────────────────┤
│                                         │
│        Video Player Container           │
│          (16:9 aspect ratio)            │
│         flex-grow justify-center        │
│                                         │
├─────────────────────────────────────────┤
│   Lyrics Panel (Bottom) h-48 md:h-64   │
│   Full-width, scrollable, centered      │
└─────────────────────────────────────────┘
```

**Song Library View** (When no video playing):
- Grid: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4
- Card spacing: gap-6
- Filter sidebar: w-64 sticky top-16 (desktop), bottom sheet (mobile)

---

## Component Library

### 1. Video Player Zone
- Container: aspect-video max-w-7xl mx-auto bg-black/50 rounded-lg overflow-hidden
- Overlay controls: Gradient fade at bottom for seamless lyric transition
- Loading state: Pulsing neon border animation

### 2. Lyrics Panel (Bottom-Mounted)
- Container: Fixed bottom, full-width, h-48 md:h-64, backdrop-blur-xl bg-black/80
- Layout: Flex column, items-center, justify-center, overflow-y-auto
- Active Line: Cyan glow text-shadow, scale-105 transform, font-semibold
- Upcoming Lines: text-secondary, opacity-60
- Past Lines: text-muted, opacity-30
- Scroll Behavior: Auto-scroll active line to center

### 3. Search Bar (Header)
- Design: Prominent, centered, w-full max-w-2xl
- Style: Rounded-full, backdrop-blur-md, border border-white/10
- States: Neon cyan border on focus, subtle glow effect
- Dual input: Placeholder "Search songs or paste YouTube link..."

### 4. Song Cards
- Layout: Aspect-square thumbnail, title overlay at bottom
- Hover: Scale-105, neon border (cyan), title background brightens
- Metadata badges: Genre pill (purple), gender icon (magenta), year (muted)
- Quick-play: Play icon overlay on hover with backdrop-blur

### 5. Filter Panel
- Sections: Collapsible accordions (Gender, Genre, Decade)
- Checkboxes: Custom styled with neon accent when checked
- Active filters: Neon pill badges with × close button
- Sticky positioning for easy access during browsing

### 6. Scoring Display (Post-Performance)
- Modal: Centered overlay, max-w-lg, rounded-2xl, backdrop-blur-2xl
- Score Visualization: Large circular progress (0-100), neon gradient fill
- Breakdown: Pitch accuracy, timing, rhythm as horizontal bars
- Feedback text: Encouraging messages based on score tiers
- Actions: "Try Again" (outline), "Next Song" (neon magenta filled)

### 7. Navigation Header
- Height: h-16, backdrop-blur-md, border-b border-white/10
- Logo: Left-aligned with neon gradient text
- Actions: Right-aligned icon buttons (Settings, Library, Profile)
- Active state: Neon cyan underline indicator

---

## Interaction Patterns

**Lyric Synchronization**:
- Smooth color transitions (300ms ease)
- Subtle scale animation for active line
- Auto-scroll with smooth behavior
- Karaoke-style highlight: Progressive word-by-word reveal (optional enhancement)

**Video Transitions**:
- Fade-in new video (500ms)
- Crossfade between songs (800ms)
- Loading skeleton with pulsing neon accents

**Filter Application**:
- Instant filtering with micro-animation on cards (stagger 50ms)
- Clear visual feedback when no results (empty state with suggestion)

---

## Responsive Behavior

**Desktop (≥1024px)**:
- Full layout as described
- Sidebar filters visible
- Lyrics panel h-64

**Tablet (768px-1023px)**:
- Lyrics panel h-56
- Grid: 2-3 columns
- Filters: Slide-out drawer

**Mobile (<768px)**:
- Stack vertically
- Lyrics panel h-48
- Single column grid
- Bottom sheet filters
- Compact search bar

---

## Images

**Hero/Background Treatment**:
- No traditional hero section - application is utility-first
- Background: Subtle animated gradient (purple to cyan) at 10% opacity
- Optional: Abstract stage lighting rays (CSS-only) for ambient atmosphere

**Song Thumbnails**:
- YouTube video thumbnails fetched via API
- Aspect ratio: 16:9 or square (user preference toggle)
- Fallback: Neon gradient placeholder with music note icon

**Performance Background**:
- During playback: Dim video player slightly, emphasize lyrics
- Ambient particle effects (optional): Floating musical notes, very subtle

---

## Accessibility & Performance

- High contrast ratios maintained (WCAG AAA for text)
- Lyrics font size adjustable via settings
- Reduced motion support: Disable all animations
- Focus indicators: Neon cyan outline (2px)
- Keyboard navigation: Full support for all interactions
- ARIA labels for scoring visualizations and dynamic content

---

## Special Considerations

**Scoring Visual Feedback**:
- Real-time pitch indicator: Vertical bar graph during singing
- Color coding: Green (on pitch), yellow (close), red (off)
- Celebratory animation on high scores (confetti, neon burst)

**Performance Optimization**:
- Lazy load song thumbnails
- Virtual scrolling for large song lists
- Debounced search (300ms)
- Memoized filter results

This design creates a premium karaoke experience with clear visual hierarchy, engaging performance feedback, and intuitive content discovery—balancing entertainment excitement with functional clarity.