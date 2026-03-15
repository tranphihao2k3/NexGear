import s from './loading.module.scss';

export default function Loading() {
    return (
        <div className={s.loaderInline}>
            {/* Floating particles */}
            <div className={s.particles}>
                <div className={s.particle} />
                <div className={s.particle} />
                <div className={s.particle} />
                <div className={s.particle} />
            </div>

            <div className={s.content}>
                {/* Hex spinner */}
                <div className={s.hexContainer}>
                    <div className={s.hexRing} />
                    <div className={s.hexCore} />
                </div>

                {/* Brand */}
                <div className={s.brand}>NEXGEAR</div>

                {/* Progress bar */}
                <div className={s.progressTrack}>
                    <div className={s.progressBar} />
                </div>

                {/* Status */}
                <div className={s.status}>Đang tải...</div>
            </div>
        </div>
    );
}
