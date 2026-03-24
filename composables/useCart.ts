import { watch, onMounted } from 'vue'

export const useCart = () => {
  // Global State menggunakan Nuxt useState
  const cart = useState<any[]>('cart', () => [])

  // Sinkronisasi dengan localStorage (Hanya di Client)
  if (process.client) {
    onMounted(() => {
      const savedCart = localStorage.getItem('cart')
      if (savedCart) {
        cart.value = JSON.parse(savedCart)
      }
    })

    watch(cart, (newCart) => {
      localStorage.setItem('cart', JSON.stringify(newCart))
    }, { deep: true })
  }

  const addToCart = (product: any) => {
    const existingItem = cart.value.find(item => item.id === product.id)
    if (existingItem) {
      existingItem.quantity += 1
    } else {
      cart.value.push({
        id: product.id,
        title: product.title,
        price: product.price,
        image_url: product.image_url,
        quantity: 1
      })
    }
  }

  const removeFromCart = (productId: any) => {
    cart.value = cart.value.filter(item => item.id !== productId)
  }

  const clearCart = () => {
    cart.value = []
  }

  return {
    cart,
    addToCart,
    removeFromCart,
    clearCart
  }
}
