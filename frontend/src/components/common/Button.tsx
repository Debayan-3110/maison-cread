import React from 'react';

interface ButtonProps {
    children: React.ReactNode;
    onClick?: () => void;
    type?: 'button' | 'submit' | 'reset';
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    className?: string;
    disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
    children,
    onClick,
    type = 'button',
    variant = 'primary',
    className = '',
    disabled = false
}) => {
    const variants = {
        primary: 'btn-solid',
        secondary: 'btn-line',
        danger: 'inline-flex items-center justify-center gap-2 bg-[#9B3B22] text-on-solid text-[13px] font-semibold rounded-full px-6 py-3 transition-opacity hover:opacity-90 active:scale-[0.98] disabled:opacity-50',
        ghost: 'btn-ghost underline underline-offset-4 decoration-current/30 hover:decoration-current',
    };

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`${variants[variant]} ${className}`}
        >
            {children}
        </button>
    );
};
