<script setup lang="ts">
  export interface NavItem {
    id: string
    label: string
    icon: 'home' | 'top' | 'bookmark' | 'bell' | 'profile'
  }

  const props = defineProps<{
    items: NavItem[]
    active: string
  }>()

  const emit = defineEmits<{
    (e: 'select', value: string): void
  }>()

  function handleSelect (id: string) {
    if (id === props.active) return

    emit('select', id)
  }
</script>

<template>
  <aside class="feed-sidebar">
    <nav aria-label="We Party">
      <ul>
        <li v-for="item in props.items" :key="item.id">
          <button :class="{ active: props.active === item.id }" type="button" @click="handleSelect(item.id)">
            <span aria-hidden="true" class="icon">
              <svg
                v-if="item.icon === 'home'"
                fill="none"
                height="20"
                viewBox="0 0 24 24"
                width="20"
              >
                <path d="M4 9.5 12 4l8 5.5V20a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1z" fill="currentColor" />
              </svg>
              <svg
                v-else-if="item.icon === 'top'"
                fill="none"
                height="20"
                viewBox="0 0 24 24"
                width="20"
              >
                <path d="m4 17 4.5-10 3.5 7 2.5-5 5 8z" fill="currentColor" />
              </svg>
              <svg
                v-else-if="item.icon === 'bookmark'"
                fill="none"
                height="20"
                viewBox="0 0 24 24"
                width="20"
              >
                <path d="M6 4h12a1 1 0 0 1 1 1v15l-7-4-7 4V5a1 1 0 0 1 1-1z" fill="currentColor" />
              </svg>
              <svg
                v-else-if="item.icon === 'bell'"
                fill="none"
                height="20"
                viewBox="0 0 24 24"
                width="20"
              >
                <path
                  d="M18 15v-3a6 6 0 0 0-12 0v3l-1.5 1.5a1 1 0 0 0 .7 1.7H18.8a1 1 0 0 0 .7-1.7z"
                  fill="currentColor"
                />
              </svg>
              <svg
                v-else
                fill="none"
                height="20"
                viewBox="0 0 24 24"
                width="20"
              >
                <path
                  d="M12 4a4 4 0 1 1 0 8 4 4 0 0 1 0-8zm0 10c-4.418 0-8 2.015-8 4.5V20h16v-1.5c0-2.485-3.582-4.5-8-4.5z"
                  fill="currentColor"
                />
              </svg>
            </span>
            <span>{{ item.label }}</span>
          </button>
        </li>
      </ul>
    </nav>

  </aside>
</template>

<style scoped>
.feed-sidebar {
  position: sticky;
  top: var(--feed-sticky-offset, 120px);
  display: flex;
  flex-direction: column;
  gap: 2rem;
  padding: 1.75rem 1.5rem 2rem;
  border-radius: 32px;
  background: #ffffff;
  box-shadow: 0 20px 60px rgba(20, 27, 68, 0.12);
  min-height: 540px;

}

ul {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

button {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  width: 100%;
  padding: 0.9rem 1rem;
  border: 0;
  border-radius: 18px;
  background: #f5f6ff;
  color: #707799;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease, transform 0.2s ease;
}

button:hover {
  transform: translateX(4px);
  background: #eef0ff;
}

button.active {
  background: linear-gradient(135deg, #ffba4b 0%, #ff5fa6 100%);
  color: #ffffff;
  box-shadow: 0 18px 34px rgba(255, 95, 166, 0.32);
}

.icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.65);
  color: inherit;
}

button.active .icon {
  background: rgba(255, 255, 255, 0.2);
}

.helper {
  margin-top: auto;
  padding-top: 1.5rem;
  border-top: 1px solid rgba(121, 132, 171, 0.14);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.helper p {
  margin: 0;
  color: #8c93ad;
  font-size: 0.85rem;
  line-height: 1.5;
}

@media (max-width: 1240px) {
  .feed-sidebar {
    position: static;
    min-height: auto;
  }
}

@media (max-width: 960px) {
  .feed-sidebar {
    display: none;
  }
}
</style>
