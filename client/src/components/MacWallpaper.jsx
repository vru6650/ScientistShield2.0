import PropTypes from 'prop-types';

/**
 * Decorative macOS-inspired wallpaper that sits behind the application shell.
 * Animated gradients and subtle noise mimic Sonoma's depth without impacting layout.
 *
 * @param {'light'|'dark'} mode - Active theme mode supplied by ThemeProvider.
 */
export default function MacWallpaper({ mode }) {
    const isDark = mode === 'dark';

    return (
        <div className="macos-wallpaper" aria-hidden>
            <div
                className={`macos-wallpaper__gradient ${
                    isDark ? 'macos-wallpaper__gradient--dark' : 'macos-wallpaper__gradient--light'
                }`}
            />
            <div className="macos-wallpaper__aurora macos-wallpaper__aurora--primary" />
            <div className="macos-wallpaper__aurora macos-wallpaper__aurora--secondary" />
            <div className="macos-wallpaper__orb macos-wallpaper__orb--top" />
            <div className="macos-wallpaper__orb macos-wallpaper__orb--bottom" />
            <div
                className={`macos-wallpaper__grid ${
                    isDark ? 'macos-wallpaper__grid--dark' : 'macos-wallpaper__grid--light'
                }`}
            />
            <div className="macos-wallpaper__noise" />
        </div>
    );
}

MacWallpaper.propTypes = {
    mode: PropTypes.oneOf(['light', 'dark']).isRequired,
};
