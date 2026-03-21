<template>
  <div class="skeleton-card glass fade-in">
    <div class="skeleton-image shimmer"></div>
    <div class="skeleton-content">
      <div class="skeleton-badge shimmer"></div>
      <div class="skeleton-title shimmer"></div>
      <div class="skeleton-description shimmer"></div>
      <div class="skeleton-description shimmer short"></div>
      <div class="skeleton-footer">
        <div class="skeleton-price shimmer"></div>
        <div class="skeleton-button shimmer"></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.skeleton-card {
  display: flex;
  flex-direction: column;
  height: 100%;
  border-radius: 20px;
  overflow: hidden;
  background: rgba(30, 41, 59, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.skeleton-image {
  width: 100%;
  padding-bottom: 75%; /* 4:3 Aspect Ratio */
  background: rgba(255, 255, 255, 0.05);
}

.skeleton-content {
  padding: 20px;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}

.skeleton-badge {
  width: 80px;
  height: 16px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  margin-bottom: 12px;
}

.skeleton-title {
  width: 100%;
  height: 24px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.05);
  margin-bottom: 12px;
}

.skeleton-description {
  width: 100%;
  height: 14px;
  border-radius: 7px;
  background: rgba(255, 255, 255, 0.03);
  margin-bottom: 8px;
}

.skeleton-description.short {
  width: 60%;
}

.skeleton-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
  padding-top: 15px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.skeleton-price {
  width: 60px;
  height: 24px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.05);
}

.skeleton-button {
  width: 70px;
  height: 36px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.05);
}

.shimmer {
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.03) 25%,
    rgba(255, 255, 255, 0.08) 50%,
    rgba(255, 255, 255, 0.03) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
</style>
