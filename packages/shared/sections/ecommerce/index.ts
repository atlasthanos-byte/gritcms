// @ts-nocheck
import React from "react";
import { registerSections } from "../registry";
import type { SectionDefinition } from "../types";

// ─── Shared schema & defaults ────────────────────────────────────────────────

const productItemFields = [
  { key: "name", label: "Product Name", type: "text" as const, required: true },
  { key: "price", label: "Price", type: "text" as const },
  { key: "image", label: "Image", type: "image" as const },
  { key: "description", label: "Description", type: "textarea" as const },
];

const ecommercePropsSchema = [
  { key: "heading", label: "Heading", type: "text" as const },
  { key: "subheading", label: "Sub-heading", type: "text" as const },
  {
    key: "items",
    label: "Products",
    type: "items" as const,
    itemFields: productItemFields,
  },
];

const paymentModulePropsSchema = [
  { key: "heading", label: "Heading", type: "text" as const },
  { key: "subheading", label: "Sub-heading", type: "text" as const },
  { key: "checkoutType", label: "Checkout Type", type: "select" as const, options: [{ label: "Product", value: "product" }, { label: "Course", value: "course" }] },
  { key: "productId", label: "Product ID", type: "number" as const },
  { key: "courseId", label: "Course ID", type: "number" as const },
  { key: "priceId", label: "Price ID (optional)", type: "number" as const },
  { key: "buttonText", label: "Button Text", type: "text" as const },
];

const defaultProducts = [
  { name: "Classic Leather Jacket", price: "$249.00", image: "", description: "Premium full-grain leather with a timeless silhouette." },
  { name: "Wireless Noise-Cancelling Headphones", price: "$179.00", image: "", description: "Immersive sound with 30-hour battery life." },
  { name: "Minimalist Watch", price: "$129.00", image: "", description: "Swiss movement, sapphire crystal, and Italian leather strap." },
  { name: "Organic Cotton Tee", price: "$39.00", image: "", description: "Sustainably made from 100% organic cotton." },
  { name: "Running Shoes Pro", price: "$159.00", image: "", description: "Lightweight with responsive cushioning for every stride." },
  { name: "Smart Water Bottle", price: "$49.00", image: "", description: "Temperature tracking and hydration reminders." },
  { name: "Canvas Backpack", price: "$89.00", image: "", description: "Waxed canvas with padded laptop compartment." },
  { name: "Ceramic Pour-Over Set", price: "$64.00", image: "", description: "Handcrafted ceramic dripper with borosilicate carafe." },
];

const defaultCategories = [
  { name: "Clothing", price: "", image: "", description: "Explore our latest apparel collection." },
  { name: "Electronics", price: "", image: "", description: "Top-rated gadgets and accessories." },
  { name: "Home & Living", price: "", image: "", description: "Everything for a beautiful home." },
  { name: "Accessories", price: "", image: "", description: "Bags, watches, and everyday essentials." },
];

// ─── ecommerce-001  Product Grid ─────────────────────────────────────────────

const Ecommerce001: React.FC<Record<string, unknown>> = (props) => {
  const heading = (props.heading as string) || "Our Products";
  const subheading = (props.subheading as string) || "Handpicked essentials for modern living.";
  const items = (props.items as typeof defaultProducts) || defaultProducts;

  return React.createElement(
    "section",
    { className: "relative overflow-hidden py-24 sm:py-32 bg-white" },
    React.createElement(
      "div",
      { className: "mx-auto max-w-7xl px-6 lg:px-8" },
      React.createElement(
        "div",
        { className: "text-center mb-16" },
        React.createElement("h2", { className: "text-4xl sm:text-5xl font-bold tracking-tight text-slate-900" }, heading),
        React.createElement("p", { className: "mt-4 text-lg text-slate-600 max-w-2xl mx-auto" }, subheading)
      ),
      React.createElement(
        "div",
        { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" },
        ...items.slice(0, 8).map((product, i) =>
          React.createElement(
            "div",
            { key: i, className: "group rounded-2xl bg-white border border-slate-200 overflow-hidden hover:shadow-lg transition-all hover:border-violet-200" },
            React.createElement(
              "div",
              { className: "relative aspect-square bg-gradient-to-br from-violet-500/20 to-indigo-500/20 flex items-center justify-center text-slate-400 text-sm overflow-hidden" },
              product.image
                ? React.createElement("img", { src: product.image, alt: product.name, className: "w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" })
                : "Image",
              React.createElement(
                "button",
                { className: "absolute bottom-3 left-3 right-3 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity shadow-lg" },
                "Add to cart"
              )
            ),
            React.createElement(
              "div",
              { className: "p-5" },
              React.createElement("h3", { className: "text-sm font-semibold text-slate-900 mb-1" }, product.name),
              React.createElement("p", { className: "text-2xl font-bold text-slate-900" }, product.price)
            )
          )
        )
      )
    )
  );
};

// ─── ecommerce-002  Featured Product ─────────────────────────────────────────

const Ecommerce002: React.FC<Record<string, unknown>> = (props) => {
  const heading = (props.heading as string) || "Featured Product";
  const subheading = (props.subheading as string) || "";
  const items = (props.items as typeof defaultProducts) || defaultProducts;
  const product = items[0];

  return React.createElement(
    "section",
    { className: "relative overflow-hidden py-24 sm:py-32 bg-slate-50" },
    React.createElement(
      "div",
      { className: "mx-auto max-w-7xl px-6 lg:px-8" },
      heading && React.createElement(
        "span",
        { className: "inline-block text-sm font-semibold text-violet-600 tracking-wide uppercase text-center w-full mb-4" },
        heading
      ),
      React.createElement(
        "div",
        { className: "flex flex-col md:flex-row items-center gap-16 mt-8" },
        React.createElement(
          "div",
          { className: "w-full md:w-1/2" },
          React.createElement("div", {
            className: "aspect-square rounded-2xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 flex items-center justify-center text-slate-400 overflow-hidden shadow-xl",
          }, product?.image ? React.createElement("img", { src: product.image, alt: product?.name, className: "w-full h-full object-cover rounded-2xl" }) : "Product Image")
        ),
        React.createElement(
          "div",
          { className: "w-full md:w-1/2" },
          React.createElement("h2", { className: "text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 mb-6" }, product?.name),
          React.createElement("p", { className: "text-3xl font-bold text-slate-900 mb-6" }, product?.price),
          React.createElement("p", { className: "text-lg text-slate-600 leading-relaxed mb-10" }, product?.description),
          React.createElement(
            "div",
            { className: "flex gap-4" },
            React.createElement(
              "button",
              { className: "rounded-xl bg-violet-600 px-8 py-3.5 text-white font-semibold hover:bg-violet-700 transition-colors shadow-lg shadow-violet-600/25" },
              "Buy now"
            ),
            React.createElement(
              "button",
              { className: "rounded-xl border border-slate-200 px-8 py-3.5 text-slate-700 font-semibold hover:bg-slate-50 transition-colors" },
              "Add to cart"
            )
          )
        )
      )
    )
  );
};

// ─── ecommerce-003  Category Cards ───────────────────────────────────────────

const Ecommerce003: React.FC<Record<string, unknown>> = (props) => {
  const heading = (props.heading as string) || "Shop by Category";
  const subheading = (props.subheading as string) || "Find exactly what you are looking for.";
  const items = (props.items as typeof defaultCategories) || defaultCategories;

  return React.createElement(
    "section",
    { className: "relative overflow-hidden py-24 sm:py-32 bg-gradient-to-b from-slate-950 to-slate-900" },
    React.createElement(
      "div",
      { className: "mx-auto max-w-7xl px-6 lg:px-8" },
      React.createElement(
        "div",
        { className: "text-center mb-16" },
        React.createElement("h2", { className: "text-4xl sm:text-5xl font-bold tracking-tight text-white" }, heading),
        React.createElement("p", { className: "mt-4 text-lg text-slate-400" }, subheading)
      ),
      React.createElement(
        "div",
        { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" },
        ...items.map((cat, i) =>
          React.createElement(
            "div",
            { key: i, className: "group relative h-72 rounded-2xl overflow-hidden cursor-pointer border border-white/10 hover:border-violet-500/30 transition-colors" },
            React.createElement("div", { className: "absolute inset-0 bg-gradient-to-br from-violet-500/20 to-indigo-500/20" }),
            React.createElement("div", { className: "absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent" }),
            React.createElement(
              "div",
              { className: "absolute inset-0 flex flex-col items-center justify-end text-center p-6" },
              React.createElement("h3", { className: "text-xl font-bold text-white mb-2" }, cat.name),
              React.createElement("p", { className: "text-sm text-slate-300" }, cat.description),
              React.createElement(
                "span",
                { className: "mt-4 text-sm font-medium text-violet-400 opacity-0 group-hover:opacity-100 transition-opacity" },
                "Shop now \u2192"
              )
            )
          )
        )
      )
    )
  );
};

// ─── ecommerce-004  Cart Summary ─────────────────────────────────────────────

const Ecommerce004: React.FC<Record<string, unknown>> = (props) => {
  const heading = (props.heading as string) || "Your Cart";
  const subheading = (props.subheading as string) || "";
  const items = (props.items as typeof defaultProducts) || defaultProducts;

  return React.createElement(
    "section",
    { className: "relative overflow-hidden py-24 sm:py-32 bg-slate-50" },
    React.createElement(
      "div",
      { className: "mx-auto max-w-3xl px-6 lg:px-8" },
      React.createElement("h2", { className: "text-3xl font-bold tracking-tight text-slate-900 mb-8" }, heading),
      React.createElement(
        "div",
        { className: "rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden" },
        React.createElement(
          "div",
          { className: "divide-y divide-slate-100" },
          ...items.slice(0, 4).map((product, i) =>
            React.createElement(
              "div",
              { key: i, className: "flex items-center gap-4 p-6" },
              React.createElement("div", {
                className: "w-16 h-16 bg-gradient-to-br from-violet-500/20 to-indigo-500/20 rounded-xl flex-shrink-0 flex items-center justify-center text-slate-400 text-xs overflow-hidden",
              }, product.image ? React.createElement("img", { src: product.image, alt: product.name, className: "w-full h-full object-cover rounded-xl" }) : "Img"),
              React.createElement(
                "div",
                { className: "flex-1 min-w-0" },
                React.createElement("h3", { className: "text-sm font-semibold text-slate-900 truncate" }, product.name),
                React.createElement("p", { className: "text-xs text-slate-500" }, "Qty: 1")
              ),
              React.createElement("span", { className: "text-sm font-bold text-slate-900" }, product.price),
              React.createElement(
                "button",
                { className: "text-slate-400 hover:text-red-500 text-sm transition-colors" },
                "\u2715"
              )
            )
          )
        ),
        React.createElement(
          "div",
          { className: "bg-slate-50 p-6 space-y-3 border-t border-slate-200" },
          React.createElement(
            "div",
            { className: "flex justify-between text-sm text-slate-600" },
            React.createElement("span", null, "Subtotal"),
            React.createElement("span", null, "$596.00")
          ),
          React.createElement(
            "div",
            { className: "flex justify-between text-sm text-slate-600" },
            React.createElement("span", null, "Shipping"),
            React.createElement("span", { className: "text-emerald-600 font-medium" }, "Free")
          ),
          React.createElement("hr", { className: "border-slate-200" }),
          React.createElement(
            "div",
            { className: "flex justify-between font-bold text-slate-900 text-lg" },
            React.createElement("span", null, "Total"),
            React.createElement("span", null, "$596.00")
          ),
          React.createElement(
            "button",
            { className: "w-full mt-4 rounded-xl bg-violet-600 py-3 text-white font-semibold hover:bg-violet-700 transition-colors shadow-lg shadow-violet-600/25" },
            "Checkout"
          )
        )
      )
    )
  );
};

// ─── ecommerce-005  Product Carousel ─────────────────────────────────────────

const Ecommerce005: React.FC<Record<string, unknown>> = (props) => {
  const heading = (props.heading as string) || "You May Also Like";
  const subheading = (props.subheading as string) || "Curated picks based on your taste.";
  const items = (props.items as typeof defaultProducts) || defaultProducts;

  return React.createElement(
    "section",
    { className: "relative overflow-hidden py-24 sm:py-32 bg-white" },
    React.createElement(
      "div",
      { className: "mx-auto max-w-7xl px-6 lg:px-8" },
      React.createElement(
        "div",
        { className: "flex items-end justify-between mb-12" },
        React.createElement(
          "div",
          null,
          React.createElement("h2", { className: "text-3xl sm:text-4xl font-bold tracking-tight text-slate-900" }, heading),
          React.createElement("p", { className: "mt-2 text-slate-600" }, subheading)
        ),
        React.createElement(
          "a",
          { href: "#", className: "text-violet-600 font-semibold text-sm hover:text-violet-700 hidden sm:block" },
          "View all \u2192"
        )
      )
    ),
    React.createElement(
      "div",
      { className: "mx-auto max-w-7xl px-6 lg:px-8 overflow-x-auto pb-4" },
      React.createElement(
        "div",
        { className: "flex gap-6", style: { minWidth: "max-content" } },
        ...items.map((product, i) =>
          React.createElement(
            "div",
            { key: i, className: "w-64 flex-shrink-0 group" },
            React.createElement(
              "div",
              { className: "aspect-square bg-gradient-to-br from-violet-500/20 to-indigo-500/20 rounded-2xl flex items-center justify-center text-slate-400 text-sm overflow-hidden" },
              product.image
                ? React.createElement("img", { src: product.image, alt: product.name, className: "w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" })
                : "Image"
            ),
            React.createElement(
              "div",
              { className: "mt-4" },
              React.createElement("h3", { className: "text-sm font-semibold text-slate-900 group-hover:text-violet-600 transition-colors" }, product.name),
              React.createElement("p", { className: "text-2xl font-bold text-slate-900 mt-1" }, product.price)
            )
          )
        )
      )
    )
  );
};

// ─── ecommerce-006  Deal Banner ──────────────────────────────────────────────

const Ecommerce006: React.FC<Record<string, unknown>> = (props) => {
  const heading = (props.heading as string) || "Flash Sale \u2014 Up to 50% Off";
  const subheading =
    (props.subheading as string) || "Limited time only. Grab your favorites before they are gone.";

  return React.createElement(
    "section",
    { className: "relative overflow-hidden py-24 sm:py-32 bg-gradient-to-br from-violet-600 via-violet-700 to-indigo-700" },
    React.createElement(
      "div",
      { className: "mx-auto max-w-7xl px-6 lg:px-8" },
      React.createElement(
        "div",
        { className: "flex flex-col md:flex-row items-center justify-between gap-10" },
        React.createElement(
          "div",
          { className: "text-center md:text-left" },
          React.createElement("h2", { className: "text-4xl sm:text-5xl font-bold tracking-tight text-white mb-4" }, heading),
          React.createElement("p", { className: "text-violet-100 text-lg" }, subheading)
        ),
        React.createElement(
          "div",
          { className: "flex gap-4" },
          React.createElement(
            "button",
            { className: "rounded-xl bg-white px-8 py-3.5 text-violet-700 font-semibold hover:bg-violet-50 transition-colors shadow-lg" },
            "Shop the sale"
          ),
          React.createElement(
            "button",
            { className: "rounded-xl border-2 border-white/30 px-8 py-3.5 text-white font-semibold hover:bg-white/10 transition-colors" },
            "Learn more"
          )
        )
      )
    )
  );
};

// ─── ecommerce-007  Collection Grid ──────────────────────────────────────────

const Ecommerce007: React.FC<Record<string, unknown>> = (props) => {
  const heading = (props.heading as string) || "Explore Collections";
  const subheading = (props.subheading as string) || "Curated sets to match your style.";
  const items = (props.items as typeof defaultCategories) || defaultCategories;

  return React.createElement(
    "section",
    { className: "relative overflow-hidden py-24 sm:py-32 bg-slate-50" },
    React.createElement(
      "div",
      { className: "mx-auto max-w-7xl px-6 lg:px-8" },
      React.createElement(
        "div",
        { className: "text-center mb-16" },
        React.createElement("h2", { className: "text-4xl sm:text-5xl font-bold tracking-tight text-slate-900" }, heading),
        React.createElement("p", { className: "mt-4 text-lg text-slate-600" }, subheading)
      ),
      React.createElement(
        "div",
        { className: "grid grid-cols-1 md:grid-cols-2 gap-6" },
        ...items.map((col, i) =>
          React.createElement(
            "div",
            { key: i, className: "relative h-80 rounded-2xl overflow-hidden group cursor-pointer shadow-lg" },
            React.createElement("div", { className: "absolute inset-0 bg-gradient-to-br from-violet-500/30 to-indigo-500/30" }),
            React.createElement("div", { className: "absolute inset-0 bg-gradient-to-t from-slate-950/70 to-transparent" }),
            React.createElement(
              "div",
              { className: "absolute bottom-0 left-0 right-0 p-8" },
              React.createElement("h3", { className: "text-2xl font-bold text-white mb-2" }, col.name),
              React.createElement("p", { className: "text-sm text-white/80 mb-4" }, col.description),
              React.createElement(
                "span",
                { className: "text-sm font-semibold text-violet-300 group-hover:text-white transition-colors" },
                "Browse collection \u2192"
              )
            )
          )
        )
      )
    )
  );
};

// ─── ecommerce-008  Product List ─────────────────────────────────────────────

const Ecommerce008: React.FC<Record<string, unknown>> = (props) => {
  const heading = (props.heading as string) || "All Products";
  const subheading = (props.subheading as string) || "Browse our complete catalog.";
  const items = (props.items as typeof defaultProducts) || defaultProducts;

  return React.createElement(
    "section",
    { className: "relative overflow-hidden py-24 sm:py-32 bg-white" },
    React.createElement(
      "div",
      { className: "mx-auto max-w-5xl px-6 lg:px-8" },
      React.createElement(
        "div",
        { className: "text-center mb-14" },
        React.createElement("h2", { className: "text-4xl sm:text-5xl font-bold tracking-tight text-slate-900" }, heading),
        React.createElement("p", { className: "mt-4 text-slate-600" }, subheading)
      ),
      React.createElement(
        "div",
        { className: "divide-y divide-slate-100" },
        ...items.map((product, i) =>
          React.createElement(
            "div",
            { key: i, className: "flex flex-col sm:flex-row items-start sm:items-center gap-5 py-6" },
            React.createElement("div", {
              className: "w-20 h-20 bg-gradient-to-br from-violet-500/20 to-indigo-500/20 rounded-xl flex-shrink-0 flex items-center justify-center text-slate-400 text-xs overflow-hidden",
            }, product.image ? React.createElement("img", { src: product.image, alt: product.name, className: "w-full h-full object-cover rounded-xl" }) : "Img"),
            React.createElement(
              "div",
              { className: "flex-1 min-w-0" },
              React.createElement("h3", { className: "text-base font-semibold text-slate-900" }, product.name),
              React.createElement("p", { className: "text-sm text-slate-500 mt-1" }, product.description)
            ),
            React.createElement(
              "div",
              { className: "flex items-center gap-4" },
              React.createElement("span", { className: "text-2xl font-bold text-slate-900" }, product.price),
              React.createElement(
                "button",
                { className: "rounded-xl bg-violet-600 px-5 py-2.5 text-white text-sm font-semibold hover:bg-violet-700 transition-colors shadow-lg shadow-violet-600/25" },
                "Add to cart"
              )
            )
          )
        )
      )
    )
  );
};

// ─── ecommerce-009  Trending ─────────────────────────────────────────────────

const Ecommerce009: React.FC<Record<string, unknown>> = (props) => {
  const heading = (props.heading as string) || "Trending Right Now";
  const subheading = (props.subheading as string) || "See what everyone is buying this week.";
  const items = (props.items as typeof defaultProducts) || defaultProducts;

  return React.createElement(
    "section",
    { className: "relative overflow-hidden py-24 sm:py-32 bg-gradient-to-b from-slate-950 to-slate-900" },
    React.createElement(
      "div",
      { className: "mx-auto max-w-7xl px-6 lg:px-8" },
      React.createElement(
        "div",
        { className: "text-center mb-16" },
        React.createElement("h2", { className: "text-4xl sm:text-5xl font-bold tracking-tight text-white" }, heading),
        React.createElement("p", { className: "mt-4 text-lg text-slate-400" }, subheading)
      ),
      React.createElement(
        "div",
        { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" },
        ...items.slice(0, 4).map((product, i) =>
          React.createElement(
            "div",
            { key: i, className: "group rounded-2xl bg-white/5 border border-white/10 overflow-hidden hover:border-violet-500/30 transition-colors" },
            React.createElement(
              "div",
              { className: "relative aspect-square bg-gradient-to-br from-violet-500/20 to-indigo-500/20 flex items-center justify-center text-slate-400 text-sm" },
              product.image
                ? React.createElement("img", { src: product.image, alt: product.name, className: "w-full h-full object-cover" })
                : "Image",
              React.createElement(
                "span",
                { className: "absolute top-3 left-3 bg-emerald-500 text-white text-xs px-3 py-1 rounded-full font-semibold" },
                "Trending"
              )
            ),
            React.createElement(
              "div",
              { className: "p-5" },
              React.createElement("h3", { className: "text-sm font-semibold text-white mb-1 group-hover:text-violet-400 transition-colors" }, product.name),
              React.createElement("p", { className: "text-xs text-slate-400 mb-4 line-clamp-2" }, product.description),
              React.createElement(
                "div",
                { className: "flex items-center justify-between" },
                React.createElement("span", { className: "text-2xl font-bold text-white" }, product.price),
                React.createElement(
                  "button",
                  { className: "rounded-xl bg-violet-600 px-4 py-2 text-white text-xs font-semibold hover:bg-violet-700 transition-colors" },
                  "Add"
                )
              )
            )
          )
        )
      )
    )
  );
};

// ─── ecommerce-010  New Arrivals ─────────────────────────────────────────────

const Ecommerce010: React.FC<Record<string, unknown>> = (props) => {
  const heading = (props.heading as string) || "New Arrivals";
  const subheading = (props.subheading as string) || "Fresh drops just landed in the store.";
  const items = (props.items as typeof defaultProducts) || defaultProducts;

  return React.createElement(
    "section",
    { className: "relative overflow-hidden py-24 sm:py-32 bg-white" },
    React.createElement(
      "div",
      { className: "mx-auto max-w-7xl px-6 lg:px-8" },
      React.createElement(
        "div",
        { className: "flex items-end justify-between mb-14" },
        React.createElement(
          "div",
          null,
          React.createElement("h2", { className: "text-4xl sm:text-5xl font-bold tracking-tight text-slate-900" }, heading),
          React.createElement("p", { className: "mt-2 text-slate-600" }, subheading)
        ),
        React.createElement(
          "a",
          { href: "#", className: "text-violet-600 font-semibold text-sm hover:text-violet-700 hidden sm:block" },
          "View all new arrivals \u2192"
        )
      ),
      React.createElement(
        "div",
        { className: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6" },
        ...items.slice(0, 8).map((product, i) =>
          React.createElement(
            "div",
            { key: i, className: "group" },
            React.createElement(
              "div",
              { className: "relative aspect-square bg-gradient-to-br from-violet-500/20 to-indigo-500/20 rounded-2xl flex items-center justify-center text-slate-400 text-sm overflow-hidden" },
              product.image
                ? React.createElement("img", { src: product.image, alt: product.name, className: "w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" })
                : "Image",
              i < 3 && React.createElement(
                "span",
                { className: "absolute top-3 left-3 bg-emerald-500 text-white text-xs px-3 py-1 rounded-full font-semibold" },
                "New"
              )
            ),
            React.createElement(
              "div",
              { className: "mt-4" },
              React.createElement("h3", { className: "text-sm font-semibold text-slate-900 group-hover:text-violet-600 transition-colors" }, product.name),
              React.createElement("p", { className: "text-2xl font-bold text-slate-900 mt-1" }, product.price)
            )
          )
        )
      )
    )
  );
};

// ─── ecommerce-011  Sale Banner ──────────────────────────────────────────────

const Ecommerce011: React.FC<Record<string, unknown>> = (props) => {
  const heading = (props.heading as string) || "End of Season Sale";
  const subheading =
    (props.subheading as string) || "Save up to 70% on selected items. While stocks last.";

  return React.createElement(
    "section",
    { className: "relative overflow-hidden py-24 sm:py-32 bg-slate-950" },
    React.createElement("div", {
      className: "absolute inset-0",
      style: { backgroundImage: "radial-gradient(ellipse at center, rgba(139,92,246,0.1) 0%, transparent 60%)" },
    }),
    React.createElement(
      "div",
      { className: "relative mx-auto max-w-7xl px-6 lg:px-8" },
      React.createElement(
        "div",
        { className: "flex flex-col md:flex-row items-center gap-16" },
        React.createElement(
          "div",
          { className: "md:w-1/2 text-center md:text-left" },
          React.createElement(
            "span",
            { className: "inline-block px-4 py-1.5 bg-red-500 text-white text-sm font-bold rounded-full mb-6" },
            "SALE"
          ),
          React.createElement("h2", { className: "text-4xl sm:text-5xl font-bold tracking-tight text-white mb-6 leading-tight" }, heading),
          React.createElement("p", { className: "text-lg text-slate-400 mb-10" }, subheading),
          React.createElement(
            "button",
            { className: "rounded-xl bg-white px-8 py-3.5 text-slate-900 font-semibold hover:bg-slate-100 transition-colors shadow-lg" },
            "Shop sale items"
          )
        ),
        React.createElement(
          "div",
          { className: "md:w-1/2" },
          React.createElement("div", {
            className: "h-80 rounded-2xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 border border-white/10 flex items-center justify-center text-slate-500",
          }, "Sale Image")
        )
      )
    )
  );
};

// ─── ecommerce-012  Product Showcase ─────────────────────────────────────────

const Ecommerce012: React.FC<Record<string, unknown>> = (props) => {
  const heading = (props.heading as string) || "The Everyday Essential";
  const subheading = (props.subheading as string) || "";
  const items = (props.items as typeof defaultProducts) || defaultProducts;
  const product = items[0];

  return React.createElement(
    "section",
    { className: "relative overflow-hidden py-24 sm:py-32 bg-slate-50" },
    React.createElement(
      "div",
      { className: "mx-auto max-w-7xl px-6 lg:px-8" },
      React.createElement(
        "div",
        { className: "grid grid-cols-1 lg:grid-cols-2 gap-16 items-center" },
        React.createElement(
          "div",
          null,
          React.createElement("div", {
            className: "aspect-square bg-gradient-to-br from-violet-500/20 to-indigo-500/20 rounded-2xl flex items-center justify-center text-slate-400 overflow-hidden shadow-xl",
          }, product?.image ? React.createElement("img", { src: product.image, alt: product?.name, className: "w-full h-full object-cover rounded-2xl" }) : "Product Showcase"),
          React.createElement(
            "div",
            { className: "grid grid-cols-3 gap-4 mt-4" },
            ...[0, 1, 2].map((j) =>
              React.createElement("div", {
                key: j,
                className: "aspect-square bg-gradient-to-br from-violet-500/10 to-indigo-500/10 rounded-xl flex items-center justify-center text-slate-400 text-xs border border-slate-200",
              }, "View " + (j + 1))
            )
          )
        ),
        React.createElement(
          "div",
          null,
          React.createElement("span", { className: "text-sm font-semibold text-violet-600 uppercase tracking-wider mb-3 block" }, heading),
          React.createElement("h2", { className: "text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 mb-6" }, product?.name),
          React.createElement("p", { className: "text-3xl font-bold text-slate-900 mb-6" }, product?.price),
          React.createElement("p", { className: "text-lg text-slate-600 leading-relaxed mb-10" }, product?.description),
          React.createElement(
            "div",
            { className: "space-y-4 mb-10" },
            ...["Premium materials", "Handcrafted quality", "Free shipping & returns"].map((feat, i) =>
              React.createElement(
                "div",
                { key: i, className: "flex items-center text-sm text-slate-700" },
                React.createElement(
                  "span",
                  { className: "w-6 h-6 bg-violet-100 text-violet-600 rounded-full flex items-center justify-center mr-3 text-xs flex-shrink-0" },
                  React.createElement(
                    "svg",
                    { className: "w-3.5 h-3.5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2.5 },
                    React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M5 13l4 4L19 7" })
                  )
                ),
                feat
              )
            )
          ),
          React.createElement(
            "div",
            { className: "flex gap-4" },
            React.createElement(
              "button",
              { className: "flex-1 rounded-xl bg-violet-600 py-3.5 text-white font-semibold hover:bg-violet-700 transition-colors shadow-lg shadow-violet-600/25" },
              "Add to cart"
            ),
            React.createElement(
              "button",
              { className: "rounded-xl border border-slate-200 px-6 py-3.5 text-slate-700 hover:bg-slate-50 transition-colors" },
              "\u2661"
            )
          )
        )
      )
    )
  );
};

// ─── ecommerce-013  Quick View ───────────────────────────────────────────────

const Ecommerce013: React.FC<Record<string, unknown>> = (props) => {
  const heading = (props.heading as string) || "Best Sellers";
  const subheading = (props.subheading as string) || "Our most popular items.";
  const items = (props.items as typeof defaultProducts) || defaultProducts;

  return React.createElement(
    "section",
    { className: "relative overflow-hidden py-24 sm:py-32 bg-white" },
    React.createElement(
      "div",
      { className: "mx-auto max-w-7xl px-6 lg:px-8" },
      React.createElement(
        "div",
        { className: "text-center mb-16" },
        React.createElement("h2", { className: "text-4xl sm:text-5xl font-bold tracking-tight text-slate-900" }, heading),
        React.createElement("p", { className: "mt-4 text-lg text-slate-600" }, subheading)
      ),
      React.createElement(
        "div",
        { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8" },
        ...items.slice(0, 6).map((product, i) =>
          React.createElement(
            "div",
            { key: i, className: "group rounded-2xl bg-white border border-slate-200 overflow-hidden hover:shadow-xl transition-all hover:border-violet-200" },
            React.createElement(
              "div",
              { className: "relative aspect-square bg-gradient-to-br from-violet-500/20 to-indigo-500/20 flex items-center justify-center text-slate-400 text-sm overflow-hidden" },
              product.image
                ? React.createElement("img", { src: product.image, alt: product.name, className: "w-full h-full object-cover" })
                : "Image",
              React.createElement(
                "div",
                { className: "absolute inset-0 bg-slate-950/0 group-hover:bg-slate-950/40 transition-colors flex items-center justify-center" },
                React.createElement(
                  "button",
                  { className: "rounded-xl bg-white px-6 py-2.5 text-slate-900 text-sm font-semibold opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0 shadow-lg" },
                  "Quick view"
                )
              )
            ),
            React.createElement(
              "div",
              { className: "p-5" },
              React.createElement("h3", { className: "text-sm font-semibold text-slate-900 mb-1" }, product.name),
              React.createElement("p", { className: "text-xs text-slate-500 mb-4 line-clamp-2" }, product.description),
              React.createElement(
                "div",
                { className: "flex items-center justify-between" },
                React.createElement("span", { className: "text-2xl font-bold text-slate-900" }, product.price),
                React.createElement(
                  "button",
                  { className: "rounded-xl bg-violet-600 px-4 py-2 text-white text-xs font-semibold hover:bg-violet-700 transition-colors shadow-lg shadow-violet-600/25" },
                  "Add to cart"
                )
              )
            )
          )
        )
      )
    )
  );
};

// ─── ecommerce-014  Brand Grid ───────────────────────────────────────────────

const Ecommerce014: React.FC<Record<string, unknown>> = (props) => {
  const heading = (props.heading as string) || "Shop by Brand";
  const subheading = (props.subheading as string) || "Discover your favorite brands all in one place.";
  const items = (props.items as typeof defaultProducts) || [
    { name: "Nike", price: "", image: "", description: "Just Do It" },
    { name: "Apple", price: "", image: "", description: "Think Different" },
    { name: "Samsung", price: "", image: "", description: "Do What You Can\u2019t" },
    { name: "Sony", price: "", image: "", description: "Be Moved" },
    { name: "Adidas", price: "", image: "", description: "Impossible Is Nothing" },
    { name: "Dyson", price: "", image: "", description: "Design That Works" },
  ];

  return React.createElement(
    "section",
    { className: "relative overflow-hidden py-24 sm:py-32 bg-slate-50" },
    React.createElement(
      "div",
      { className: "mx-auto max-w-7xl px-6 lg:px-8" },
      React.createElement(
        "div",
        { className: "text-center mb-16" },
        React.createElement("h2", { className: "text-4xl sm:text-5xl font-bold tracking-tight text-slate-900" }, heading),
        React.createElement("p", { className: "mt-4 text-lg text-slate-600" }, subheading)
      ),
      React.createElement(
        "div",
        { className: "grid grid-cols-2 sm:grid-cols-3 gap-6" },
        ...items.slice(0, 6).map((brand, i) =>
          React.createElement(
            "a",
            { key: i, href: "#", className: "group flex flex-col items-center justify-center p-8 rounded-2xl bg-white border border-slate-200 hover:border-violet-300 hover:shadow-lg transition-all" },
            React.createElement("div", {
              className: "w-16 h-16 bg-gradient-to-br from-violet-500/20 to-indigo-500/20 rounded-2xl flex items-center justify-center text-slate-500 text-sm mb-4 group-hover:from-violet-500/30 group-hover:to-indigo-500/30 transition-colors overflow-hidden",
            }, brand.image ? React.createElement("img", { src: brand.image, alt: brand.name, className: "w-full h-full object-contain p-2" }) : brand.name.charAt(0)),
            React.createElement("h3", { className: "text-base font-semibold text-slate-900 mb-1 group-hover:text-violet-600 transition-colors" }, brand.name),
            React.createElement("p", { className: "text-xs text-slate-500" }, brand.description)
          )
        )
      )
    )
  );
};

// ─── ecommerce-015  Reviews ──────────────────────────────────────────────────

const Ecommerce015: React.FC<Record<string, unknown>> = (props) => {
  const heading = (props.heading as string) || "Customer Reviews";
  const subheading = (props.subheading as string) || "See what our customers are saying.";

  const reviews = [
    { name: "Jessica M.", rating: 5, text: "Absolutely love the quality! The leather jacket exceeded my expectations. Will definitely order again.", date: "Jan 20, 2026" },
    { name: "Thomas R.", rating: 5, text: "The headphones have incredible sound quality and the battery lasts forever. Best purchase this year.", date: "Jan 18, 2026" },
    { name: "Priya K.", rating: 4, text: "Beautiful watch with a classic design. The leather strap is very comfortable. Shipping was fast.", date: "Jan 15, 2026" },
    { name: "Daniel S.", rating: 5, text: "The organic cotton tee is so soft and fits perfectly. Great sustainable option for everyday wear.", date: "Jan 12, 2026" },
    { name: "Maria L.", rating: 4, text: "Running shoes are lightweight and comfortable. Perfect for my daily 5k. Would recommend to anyone.", date: "Jan 10, 2026" },
    { name: "Alex W.", rating: 5, text: "The smart water bottle reminds me to stay hydrated throughout the day. Such a clever product!", date: "Jan 8, 2026" },
  ];

  return React.createElement(
    "section",
    { className: "relative overflow-hidden py-24 sm:py-32 bg-white" },
    React.createElement(
      "div",
      { className: "mx-auto max-w-7xl px-6 lg:px-8" },
      React.createElement(
        "div",
        { className: "text-center mb-16" },
        React.createElement("h2", { className: "text-4xl sm:text-5xl font-bold tracking-tight text-slate-900" }, heading),
        React.createElement("p", { className: "mt-4 text-lg text-slate-600" }, subheading),
        React.createElement(
          "div",
          { className: "flex items-center justify-center gap-1 mt-6" },
          ...[1, 2, 3, 4, 5].map((s) =>
            React.createElement("span", { key: s, className: "text-amber-400 text-xl" }, "\u2605")
          ),
          React.createElement("span", { className: "ml-2 text-sm text-slate-600 font-medium" }, "4.8 out of 5 based on 2,431 reviews")
        )
      ),
      React.createElement(
        "div",
        { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" },
        ...reviews.map((review, i) =>
          React.createElement(
            "div",
            { key: i, className: "rounded-2xl bg-slate-50 border border-slate-200 p-6 hover:shadow-md transition-shadow" },
            React.createElement(
              "div",
              { className: "flex items-center gap-1 mb-4" },
              ...[1, 2, 3, 4, 5].map((s) =>
                React.createElement("span", {
                  key: s,
                  className: `text-sm ${s <= review.rating ? "text-amber-400" : "text-slate-300"}`,
                }, "\u2605")
              )
            ),
            React.createElement("p", { className: "text-sm text-slate-700 leading-relaxed mb-5" }, review.text),
            React.createElement(
              "div",
              { className: "flex items-center justify-between" },
              React.createElement(
                "div",
                { className: "flex items-center" },
                React.createElement("div", { className: "w-8 h-8 bg-gradient-to-br from-violet-500 to-indigo-500 rounded-full mr-3" }),
                React.createElement("span", { className: "text-sm font-semibold text-slate-900" }, review.name)
              ),
              React.createElement("span", { className: "text-xs text-slate-400" }, review.date)
            )
          )
        )
      )
    )
  );
};

const EcommercePayment: React.FC<Record<string, unknown>> = (props) => {
  const heading = (props.heading as string) || "Checkout";
  const subheading = (props.subheading as string) || "Complete your payment securely.";
  const buttonText = (props.buttonText as string) || "Pay with Stripe";
  const onCheckout = props.onCheckout as (() => void) | undefined;
  const isProcessing = Boolean(props.isProcessing);
  const error = (props.checkoutError as string) || "";

  return React.createElement(
    "section",
    { className: "relative overflow-hidden py-20 bg-slate-50" },
    React.createElement(
      "div",
      { className: "mx-auto max-w-3xl px-6 lg:px-8" },
      React.createElement(
        "div",
        { className: "rounded-2xl border border-slate-200 bg-white p-8 shadow-sm" },
        React.createElement("h2", { className: "text-3xl font-bold text-slate-900 mb-3" }, heading),
        React.createElement("p", { className: "text-slate-600 mb-6" }, subheading),
        error && React.createElement("p", { className: "text-sm text-red-600 mb-4" }, error),
        React.createElement(
          "button",
          {
            type: "button",
            onClick: onCheckout,
            disabled: !onCheckout || isProcessing,
            className: "w-full rounded-xl bg-violet-600 px-6 py-3 text-white font-semibold hover:bg-violet-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors",
          },
          isProcessing ? "Processing..." : buttonText
        )
      )
    )
  );
};

// ─── Section definitions ─────────────────────────────────────────────────────

const ecommerceSections: SectionDefinition[] = [
  {
    id: "ecommerce-001",
    category: "ecommerce",
    name: "Product Grid",
    description: "Responsive product card grid with hover add-to-cart buttons.",
    tags: ["ecommerce", "products", "grid", "cards", "shop"],
    defaultProps: { heading: "Our Products", subheading: "Handpicked essentials for modern living.", items: defaultProducts },
    propsSchema: ecommercePropsSchema,
    component: Ecommerce001,
  },
  {
    id: "ecommerce-002",
    category: "ecommerce",
    name: "Featured Product",
    description: "Single featured product hero with large image, price, and buy/add buttons.",
    tags: ["ecommerce", "featured", "product", "hero"],
    defaultProps: { heading: "Featured Product", subheading: "", items: defaultProducts },
    propsSchema: ecommercePropsSchema,
    component: Ecommerce002,
  },
  {
    id: "ecommerce-003",
    category: "ecommerce",
    name: "Category Cards",
    description: "Product category cards with overlay images and shop-now links.",
    tags: ["ecommerce", "categories", "cards", "overlay"],
    defaultProps: { heading: "Shop by Category", subheading: "Find exactly what you are looking for.", items: defaultCategories },
    propsSchema: ecommercePropsSchema,
    component: Ecommerce003,
  },
  {
    id: "ecommerce-004",
    category: "ecommerce",
    name: "Cart Summary",
    description: "Shopping cart summary with line items, subtotal, and checkout button.",
    tags: ["ecommerce", "cart", "checkout", "summary"],
    defaultProps: { heading: "Your Cart", subheading: "", items: defaultProducts },
    propsSchema: ecommercePropsSchema,
    component: Ecommerce004,
  },
  {
    id: "ecommerce-005",
    category: "ecommerce",
    name: "Product Carousel",
    description: "Horizontally scrolling product cards in a recommendation style.",
    tags: ["ecommerce", "carousel", "scroll", "recommendations"],
    defaultProps: { heading: "You May Also Like", subheading: "Curated picks based on your taste.", items: defaultProducts },
    propsSchema: ecommercePropsSchema,
    component: Ecommerce005,
  },
  {
    id: "ecommerce-006",
    category: "ecommerce",
    name: "Deal Banner",
    description: "Promotional deal banner with gradient background and CTA buttons.",
    tags: ["ecommerce", "deal", "banner", "promotion", "sale"],
    defaultProps: {
      heading: "Flash Sale \u2014 Up to 50% Off",
      subheading: "Limited time only. Grab your favorites before they are gone.",
      items: [],
    },
    propsSchema: ecommercePropsSchema,
    component: Ecommerce006,
  },
  {
    id: "ecommerce-007",
    category: "ecommerce",
    name: "Collection Grid",
    description: "Collection/category grid with large overlay cards and browse links.",
    tags: ["ecommerce", "collections", "grid", "overlay"],
    defaultProps: { heading: "Explore Collections", subheading: "Curated sets to match your style.", items: defaultCategories },
    propsSchema: ecommercePropsSchema,
    component: Ecommerce007,
  },
  {
    id: "ecommerce-008",
    category: "ecommerce",
    name: "Product List",
    description: "List-style product display with thumbnails, descriptions, and add-to-cart.",
    tags: ["ecommerce", "list", "products", "catalog"],
    defaultProps: { heading: "All Products", subheading: "Browse our complete catalog.", items: defaultProducts },
    propsSchema: ecommercePropsSchema,
    component: Ecommerce008,
  },
  {
    id: "ecommerce-009",
    category: "ecommerce",
    name: "Trending Products",
    description: "Trending products grid with badge labels and quick add buttons.",
    tags: ["ecommerce", "trending", "popular", "badges"],
    defaultProps: { heading: "Trending Right Now", subheading: "See what everyone is buying this week.", items: defaultProducts },
    propsSchema: ecommercePropsSchema,
    component: Ecommerce009,
  },
  {
    id: "ecommerce-010",
    category: "ecommerce",
    name: "New Arrivals",
    description: "New arrivals product grid with 'New' badges and hover zoom effect.",
    tags: ["ecommerce", "new", "arrivals", "fresh"],
    defaultProps: { heading: "New Arrivals", subheading: "Fresh drops just landed in the store.", items: defaultProducts },
    propsSchema: ecommercePropsSchema,
    component: Ecommerce010,
  },
  {
    id: "ecommerce-011",
    category: "ecommerce",
    name: "Sale Banner",
    description: "Dark-themed sale banner with bold typography and shop CTA.",
    tags: ["ecommerce", "sale", "banner", "discount", "dark"],
    defaultProps: {
      heading: "End of Season Sale",
      subheading: "Save up to 70% on selected items. While stocks last.",
      items: [],
    },
    propsSchema: ecommercePropsSchema,
    component: Ecommerce011,
  },
  {
    id: "ecommerce-012",
    category: "ecommerce",
    name: "Product Showcase",
    description: "Large product showcase with multiple image views, features, and wishlist.",
    tags: ["ecommerce", "showcase", "product", "detail", "features"],
    defaultProps: { heading: "The Everyday Essential", subheading: "", items: defaultProducts },
    propsSchema: ecommercePropsSchema,
    component: Ecommerce012,
  },
  {
    id: "ecommerce-013",
    category: "ecommerce",
    name: "Quick View Products",
    description: "Product cards with hover quick-view overlay and add-to-cart.",
    tags: ["ecommerce", "quick-view", "products", "hover"],
    defaultProps: { heading: "Best Sellers", subheading: "Our most popular items.", items: defaultProducts },
    propsSchema: ecommercePropsSchema,
    component: Ecommerce013,
  },
  {
    id: "ecommerce-014",
    category: "ecommerce",
    name: "Brand Grid",
    description: "Shop-by-brand grid with logo placeholders and brand taglines.",
    tags: ["ecommerce", "brands", "grid", "shop-by"],
    defaultProps: {
      heading: "Shop by Brand",
      subheading: "Discover your favorite brands all in one place.",
      items: [
        { name: "Nike", price: "", image: "", description: "Just Do It" },
        { name: "Apple", price: "", image: "", description: "Think Different" },
        { name: "Samsung", price: "", image: "", description: "Do What You Can\u2019t" },
        { name: "Sony", price: "", image: "", description: "Be Moved" },
        { name: "Adidas", price: "", image: "", description: "Impossible Is Nothing" },
        { name: "Dyson", price: "", image: "", description: "Design That Works" },
      ],
    },
    propsSchema: ecommercePropsSchema,
    component: Ecommerce014,
  },
  {
    id: "ecommerce-015",
    category: "ecommerce",
    name: "Product Reviews",
    description: "Customer review cards with star ratings, text, and reviewer info.",
    tags: ["ecommerce", "reviews", "ratings", "testimonials"],
    defaultProps: { heading: "Customer Reviews", subheading: "See what our customers are saying.", items: [] },
    propsSchema: ecommercePropsSchema,
    component: Ecommerce015,
  },
  {
    id: "ecommerce-payment-001",
    category: "ecommerce",
    name: "Payment Module",
    description: "Initiates secure checkout for product or course purchases.",
    tags: ["ecommerce", "checkout", "payment", "stripe"],
    defaultProps: {
      heading: "Secure Checkout",
      subheading: "Pay with card using Stripe.",
      checkoutType: "product",
      productId: 0,
      courseId: 0,
      priceId: 0,
      buttonText: "Pay now",
    },
    propsSchema: paymentModulePropsSchema,
    component: EcommercePayment,
  },
];

registerSections(ecommerceSections);
