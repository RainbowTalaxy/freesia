import gsap from 'gsap';
import styles from './style.module.css';

const C = {
    panel: {
        PADDING_PERCENT: 0.07, // of width
        BAR_HEIGHT: 72,
    },
    info: {
        INACTIVE_MARGIN_TOP: 8,
        ACTIVE_MARGIN_LEFT: 16,
        HEIGHT: 64,
        INACTIVE_FONTSIZE: 20,
        ACTIVE_FONTSIZE: 16,
    },
    controlCenter: {
        MIN_HEIGHT: 160,
        MAX_HEIGHT: 240,
    },
};

const getInitialPositions = (lyricOn: boolean) => {
    const panel = document.querySelector(`.${styles.panel}`)!;
    // 获取 container 的宽高
    const { width, height } = panel.getBoundingClientRect();
    // 计算可用高度
    let panelHPadding = width * C.panel.PADDING_PERCENT;
    let panelVPadding = 48;
    let innerWidth = width - panelHPadding * 2;
    let innerHeight = height - panelVPadding * 2;
    const infoHeight = C.info.HEIGHT + C.info.INACTIVE_MARGIN_TOP;
    // 调整容器宽度
    const validCoverLength =
        innerHeight - infoHeight - C.controlCenter.MIN_HEIGHT;
    innerWidth = Math.min(innerWidth, validCoverLength);
    panelHPadding = (width - innerWidth) / 2;
    let coverLength = innerWidth;
    // 调整容器高度
    const validControlCenterHeight = Math.min(
        innerHeight - coverLength - infoHeight,
        C.controlCenter.MAX_HEIGHT,
    );
    const coverHeight = innerHeight - infoHeight - validControlCenterHeight;
    const coverHPadding = (coverHeight - coverLength) / 2;

    const initialTop = panelVPadding;

    let cover = {
        top: initialTop + coverHPadding,
        left: panelHPadding,
        width: coverLength,
        height: coverLength,
    };
    let info = {
        top:
            coverHPadding +
            cover.top +
            cover.height +
            C.info.INACTIVE_MARGIN_TOP,
        left: panelHPadding,
        width: innerWidth,
        height: C.info.HEIGHT,
        fontSize: C.info.INACTIVE_FONTSIZE,
    };
    let content = {
        top: info.top + info.height,
        left: panelHPadding,
        width: innerWidth,
        height: 0,
    };
    const controlCenterTop = content.top + content.height;
    const controlCenterContentHeight =
        innerHeight - (controlCenterTop - initialTop);
    const controlCenter = {
        top: controlCenterTop,
        left: panelHPadding,
        width: innerWidth,
        height: controlCenterContentHeight + panelVPadding,
        paddingBottom: panelVPadding,
    };
    if (lyricOn) {
        cover = {
            top: initialTop,
            left: panelHPadding,
            width: C.panel.BAR_HEIGHT,
            height: C.panel.BAR_HEIGHT,
        };
        info = {
            top: initialTop,
            left:
                panelHPadding + C.panel.BAR_HEIGHT + C.info.ACTIVE_MARGIN_LEFT,
            width: innerWidth - C.panel.BAR_HEIGHT - C.info.ACTIVE_MARGIN_LEFT,
            height: C.panel.BAR_HEIGHT,
            fontSize: C.info.ACTIVE_FONTSIZE,
        };
        content = {
            top: initialTop + C.panel.BAR_HEIGHT,
            left: panelHPadding,
            width: innerWidth,
            height:
                innerHeight - C.panel.BAR_HEIGHT - controlCenterContentHeight,
        };
    }
    return {
        cover,
        info,
        content,
        controlCenter,
    };
};

class Animation {
    static initPosition(lyricOn: boolean) {
        const { cover, info, content, controlCenter } =
            getInitialPositions(lyricOn);
        gsap.set(`.${styles.cover}`, {
            ...cover,
        });
        gsap.set(`.${styles.info}`, {
            ...info,
        });
        gsap.set(`.${styles.content}`, {
            ...content,
        });
        gsap.set(`.${styles.controlCenter}`, {
            ...controlCenter,
        });
        gsap.set(`.${styles.panel}`, {
            opacity: 1,
        });
    }

    static transition(lyricOn: boolean) {
        const { cover, info, content, controlCenter } =
            getInitialPositions(lyricOn);
        const animationProps = {
            duration: 0.3,
            ease: 'power2.out',
        };
        gsap.to(`.${styles.cover}`, {
            ...cover,
            ...animationProps,
            ease: 'power2.out',
        });
        gsap.to(`.${styles.info}`, {
            ...info,
            ...animationProps,
        });
        gsap.to(`.${styles.content}`, {
            ...content,
            ...animationProps,
        });
        gsap.to(`.${styles.controlCenter}`, {
            ...controlCenter,
            ...animationProps,
        });
    }
}

export default Animation;
