import { BsFacebook, BsInstagram, BsTwitter, BsGithub, BsDribbble } from 'react-icons/bs';

export const footerLinks = [
    {
        title: 'About',
        links: [
            { name: '100 JS Projects', href: 'https://www.100jsprojects.com' },
            { name: "Sahand's Blog", href: '/about' },
        ],
    },
    {
        title: 'Follow us',
        links: [
            { name: 'Github', href: 'https://github.com/sahandghavidel' },
            { name: 'Discord', href: '#' },
        ],
    },
    {
        title: 'Legal',
        links: [
            { name: 'Privacy Policy', href: '#' },
            { name: 'Terms & Conditions', href: '#' },
        ],
    },
];

export const socialMediaLinks = [
    { name: 'Facebook', href: '#', icon: BsFacebook },
    { name: 'Instagram', href: '#', icon: BsInstagram },
    { name: 'Twitter', href: '#', icon: BsTwitter },
    { name: 'Github', href: 'https://github.com/sahandghavidel', icon: BsGithub },
    { name: 'Dribbble', href: '#', icon: BsDribbble },
];