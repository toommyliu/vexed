<script>
  let {
    variant = "primary",
    size = "medium",
    disabled = false,
    type = "button",
    onclick,
    children,
    ...props
  } = $props();

  const variants = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white border-blue-600",
    secondary: "bg-gray-200 hover:bg-gray-300 text-gray-900 border-gray-300",
    danger: "bg-red-600 hover:bg-red-700 text-white border-red-600",
    ghost: "bg-transparent hover:bg-gray-100 text-gray-700 border-gray-300",
  };

  const sizes = {
    small: "px-3 py-1.5 text-sm",
    medium: "px-4 py-2 text-base",
    large: "px-6 py-3 text-lg",
  };

  const variantClass = variants[variant] || variants.primary;
  const sizeClass = sizes[size] || sizes.medium;
</script>

<button
  {type}
  {disabled}
  {onclick}
  class="inline-flex items-center justify-center rounded-md border font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 {variantClass} {sizeClass}"
  {...props}
>
  {@render children()}
</button>
