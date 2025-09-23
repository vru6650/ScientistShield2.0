import React from 'react';

const Button = React.forwardRef(({ as: Component = 'button', variant = 'primary', className = '', ...props }, ref) => {
    const base = 'px-space-md py-space-sm rounded-radius-md font-medium transition-colors duration-200 focus:outline-none';
    const variants = {
        primary: 'bg-professional-blue-600 text-white hover:bg-professional-blue-700',
        secondary: 'bg-subtle-gray-200 text-gray-800 hover:bg-subtle-gray-300',
        danger: 'bg-red-600 text-white hover:bg-red-700',
    };
    const variantClasses = variants[variant] || '';
    return (
        <Component ref={ref} className={`${base} ${variantClasses} ${className}`} {...props} />
    );
});

export default Button;