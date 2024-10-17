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
  `email` VARCHAR(100) NOT NULL,
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
  `reorder_level` INT DEFAULT 10, -- minimum stock level before reorder is triggered
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create an orders (POS) table to store customer orders
CREATE TABLE IF NOT EXISTS `orders` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `order_number` VARCHAR(50) NOT NULL,
  `user_id` INT, -- cashier/user who created the order
  `total_price` DECIMAL(10, 2) NOT NULL,
  `payment_method` ENUM('cash', 'card', 'mobile') NOT NULL,
  `status` ENUM('pending', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
);

-- Create an order_items table to store the items within each order
CREATE TABLE IF NOT EXISTS `order_items` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `order_id` INT NOT NULL,
  `inventory_id` INT NOT NULL, -- reference to inventory table
  `quantity` INT NOT NULL,
  `unit_price` DECIMAL(10, 2) NOT NULL,
  `total_price` DECIMAL(10, 2) AS (`quantity` * `unit_price`) STORED,
  FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`),
  FOREIGN KEY (`inventory_id`) REFERENCES `inventory`(`id`)
);

-- Insert some test data
INSERT INTO inventory (item_name, quantity, unit_price, reorder_level, category) VALUES
('Tomatoes', 50, 1.50, 10, 'Produce'),
('Chicken Breast', 30, 5.00, 5, 'Meat'),
('Cheddar Cheese', 20, 3.25, 8, 'Dairy'),
('Olive Oil', 15, 8.00, 5, 'Condiments'),
('Basmati Rice', 40, 2.00, 10, 'Grains'),
('Broccoli', 25, 1.75, 10, 'Produce'),
('Ground Beef', 35, 6.50, 5, 'Meat'),
('Yogurt', 10, 1.00, 5, 'Dairy'),
('Pasta', 50, 1.20, 15, 'Grains'),
('Ketchup', 20, 2.50, 10, 'Condiments');