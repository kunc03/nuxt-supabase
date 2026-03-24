<template>
  <header class="hero-section fade-in">
    <div class="ambient-glow"></div>
    <div class="hero-content">
      <h1 class="hero-title">
        <span class="gradient-text">Future</span> of Shopping
      </h1>
      <p class="hero-subtitle">
        Discover our curated collection of premium products with stunning aesthetics.
      </p>
    </div>
  </header>
</template>

<style scoped>
.hero-section {
  text-align: center;
  padding: 80px 0 60px 0;
  position: relative;
}

.ambient-glow {
  position: absolute;
  top: -100px;
  left: 50%;
  transform: translateX(-50%);
  width: 600px;
  height: 400px;
  background: radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, rgba(168, 85, 247, 0.1) 50%, transparent 100%);
  filter: blur(60px);
  z-index: -1;
  pointer-events: none;
}

.hero-title {
  font-size: 4rem;
  font-weight: 800;
  margin-bottom: 16px;
  letter-spacing: -0.02em;
}

.gradient-text {
  background: linear-gradient(135deg, #6366f1, #a855f7);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.hero-subtitle {
  color: #94a3b8;
  font-size: 1.25rem;
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.6;
}

@media (max-width: 768px) {
  .hero-title {
    font-size: 2.5rem;
  }
  .hero-subtitle {
    font-size: 1rem;
  }
}
</style>
