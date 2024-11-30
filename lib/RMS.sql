-- Create the restaurant-management database
CREATE DATABASE IF NOT EXISTS `restaurant_management`;

-- Use the created database
USE `restaurant_management`;

-- Create a roles table (to define different access levels)
CREATE TABLE IF NOT EXISTS `roles` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `role_name` VARCHAR(50) NOT NULL
);

-- Create a users table (with different roles like admin, cashier, manager)
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(50) NOT NULL,
  `password` VARCHAR(100) NOT NULL, -- hashed password
  `email` VARCHAR(100) NOT NULL UNIQUE,
  `phone` VARCHAR(100) NOT NULL,
  `role_id` INT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`)
);

-- Insert default roles
INSERT INTO `roles` (`role_name`) VALUES ('admin'), ('manager'), ('cashier'), ('kitchen');

-- Create an inventory table to manage stock items
CREATE TABLE IF NOT EXISTS `inventory` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `item_name` VARCHAR(100) NOT NULL,
  `category` VARCHAR(100) NOT NULL,
  `quantity` INT NOT NULL,
  `unit_price` DECIMAL(10, 2) NOT NULL,
  `reorder_level` INT DEFAULT 10,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create a menu table to manage menu items
CREATE TABLE IF NOT EXISTS `menu` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `item_name` VARCHAR(255) NOT NULL,
  `price` DECIMAL(10, 2) NOT NULL,
  `category` VARCHAR(255),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create an orders (POS) table to store customer orders
CREATE TABLE IF NOT EXISTS `orders` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `order_number` VARCHAR(50) NOT NULL,
  `user_id` INT, -- cashier/user who created the order
  `total_price` DECIMAL(10, 2) NOT NULL,
  `payment_method` ENUM('Not Selected', 'cash', 'card', 'mobile') NOT NULL,
  `status` ENUM('pending', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
);

-- Create an order_items table to store the items within each order
CREATE TABLE IF NOT EXISTS `order_items` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `order_id` INT NOT NULL,
  `menu_id` INT NOT NULL,
  `quantity` INT NOT NULL,
  `unit_price` DECIMAL(10, 2) NOT NULL,
  `total_price` DECIMAL(10, 2),
  FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`),
  FOREIGN KEY (`menu_id`) REFERENCES `menu`(`id`)
);

-- Insert test data for inventory
INSERT INTO `inventory` (item_name, quantity, unit_price, reorder_level, category) VALUES
('Maize Flour', 100, 60, 20, 'Grains'),
('Collard Greens (Sukuma Wiki)', 150, 30, 50, 'Vegetables'),
('Goat Meat', 80, 400, 10, 'Meat'),
('Tilapia Fish', 40, 300, 10, 'Fish'),
('Dry Maize', 100, 50, 20, 'Grains'),
('Potatoes', 70, 120, 15, 'Vegetables'),
('Kidney Beans', 60, 60, 10, 'Legumes'),
('Wheat Flour', 100, 50, 25, 'Grains'),
('Coconut Milk', 50, 80, 10, 'Condiments'),
('Vegetable Oil', 50, 150, 15, 'Condiments');

-- Insert test data for menu
INSERT INTO `menu` (item_name, price, category) VALUES
('Ugali', 50, 'Main'),
('Sukuma Wiki', 30, 'Main'),
('Nyama Choma', 400, 'Main'),
('Samaki', 300, 'Main'),
('Githeri', 100, 'Vegetarian'),
('Mukimo', 150, 'Vegetarian'),
('Pilau', 200, 'Main'),
('Chapati', 20, 'Sides'),
('Mandazi', 10, 'Snacks'),
('Biryani', 250, 'Main'),
('Mutura', 80, 'Snacks'),
('Kachumbari', 40, 'Salads'),
('Maharagwe', 60, 'Vegetarian'),
('Omena', 150, 'Snacks'),
('Matoke', 120, 'Vegetarian'),
('Wali wa Nazi', 150, 'Main'),
('Njahi', 80, 'Vegetarian'),
('Mbaazi za Nazi', 90, 'Vegetarian'),
('Viazi Karai', 50, 'Snacks');
