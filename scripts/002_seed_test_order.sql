-- Seed a test order for development
INSERT INTO public.orders (order_id, restaurant_name, food_items, alcohol_items, categories)
VALUES (
  'test-order-123',
  'Luigi''s Pizza Palace',
  '["Margherita Pizza", "Caesar Salad", "Tiramisu"]'::jsonb,
  '["House Red Wine", "Limoncello"]'::jsonb,
  '["Italian", "Pizza", "Casual Dining"]'::jsonb
)
ON CONFLICT (order_id) DO UPDATE
SET 
  restaurant_name = EXCLUDED.restaurant_name,
  food_items = EXCLUDED.food_items,
  alcohol_items = EXCLUDED.alcohol_items,
  categories = EXCLUDED.categories;
