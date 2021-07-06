import { exception } from 'console';
import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart')
    if (storagedCart) {
      return JSON.parse(storagedCart);
    }
    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const response = await api.get(`/stock/${productId}`)
      const stock = (response.data as Stock).amount
      const newCart = [...cart]
      const productInCart = newCart.find(el => el.id === productId)

      if (stock < (productInCart ? productInCart.amount:0)+1) {
        toast.error('Quantidade solicitada fora de estoque');
        return
      }

      if (productInCart) {
        productInCart.amount++
      } else {
        const responseProduct = await api.get(`/products/${productId}`)
        const product = (responseProduct.data as Product)
        newCart.push({ ...product, amount: 1 })
      }
      console.log(newCart)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))
      setCart(newCart)
      console.log(cart)
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const newCart = cart.filter(el => el.id !== productId)
      if (newCart.length === cart.length) throw Error('Não encontrado!')
      localStorage.setItem('@RocketShoes:cart',JSON.stringify(newCart))
      setCart(newCart)
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (!amount) return

      const response = await api.get(`/stock/${productId}`)
      const stock = (response.data as Stock).amount
      console.log(stock)
      if (stock >= amount) {
        const newCart = [...cart]
        const productInCart = newCart.find(el => el.id === productId);
        if (productInCart) {
          productInCart.amount = amount
          localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))
          setCart(newCart)
          console.log(cart)
        }
      } else {
        toast.error('Quantidade solicitada fora de estoque');
      }
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
