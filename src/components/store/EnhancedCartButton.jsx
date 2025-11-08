import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function EnhancedCartButton({ onAddToCart, disabled }) {
  const [isAdding, setIsAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const handleClick = async () => {
    if (disabled || isAdding) return;
    
    setIsAdding(true);
    await onAddToCart();
    setIsAdding(false);
    setJustAdded(true);
    
    setTimeout(() => {
      setJustAdded(false);
    }, 2000);
  };

  return (
    <div className="relative inline-block">
      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ scale: 1, opacity: 1 }}
            animate={{ scale: 2, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0 rounded-full border-4 border-cyan-500"
            style={{ zIndex: -1 }}
          />
        )}
      </AnimatePresence>
      
      <Button
        onClick={handleClick}
        disabled={disabled || isAdding}
        className={`relative transition-all duration-300 ${
          justAdded 
            ? 'bg-green-500 hover:bg-green-600' 
            : 'bg-cyan-500 hover:bg-cyan-600'
        }`}
      >
        <motion.div
          animate={isAdding ? { rotate: 360 } : {}}
          transition={{ duration: 0.6 }}
        >
          {justAdded ? (
            <Check className="w-4 h-4 mr-2" />
          ) : (
            <ShoppingCart className="w-4 h-4 mr-2" />
          )}
        </motion.div>
        {justAdded ? 'Added!' : isAdding ? 'Adding...' : 'Add to Cart'}
      </Button>
    </div>
  );
}