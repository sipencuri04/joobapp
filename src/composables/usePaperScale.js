import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

/**
 * Menskalakan "kertas" A4 (lebar tetap 794px) agar pas dengan lebar layar,
 * tanpa merusak layout dokumen. Hanya presentasi — dimatikan sementara saat
 * export PDF (lihat `disabled`) agar hasil PDF tetap identik.
 */
export function usePaperScale(paperWidth = 794, disabled = ref(false)) {
  const containerRef = ref(null)
  const paperRef = ref(null)
  const containerWidth = ref(paperWidth)
  const paperHeight = ref(1120)

  let ro = null

  const scale = computed(() => {
    if (disabled.value) return 1
    const s = containerWidth.value / paperWidth
    return Math.min(1, Math.max(0.3, s))
  })

  const outerStyle = computed(() => (
    scale.value < 1
      ? { height: `${Math.ceil(paperHeight.value * scale.value)}px`, width: '100%', overflow: 'hidden' }
      : {}
  ))

  const innerStyle = computed(() => (
    scale.value < 1
      ? { transform: `scale(${scale.value})`, transformOrigin: 'top left', width: `${paperWidth}px` }
      : {}
  ))

  function measure() {
    const w = containerRef.value?.clientWidth || 0
    const h = paperRef.value?.offsetHeight || 0
    if (w > 0) containerWidth.value = w
    if (h > 0) paperHeight.value = h
  }

  onMounted(() => {
    measure()
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(measure)
      if (containerRef.value) ro.observe(containerRef.value)
      if (paperRef.value) ro.observe(paperRef.value)
    } else {
      window.addEventListener('resize', measure)
    }
  })

  onBeforeUnmount(() => {
    if (ro) ro.disconnect()
    window.removeEventListener('resize', measure)
  })

  return { containerRef, paperRef, scale, outerStyle, innerStyle }
}
