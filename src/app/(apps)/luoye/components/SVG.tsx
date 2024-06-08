const SVG = {
    Lock: ({ size = 16 }: { size?: number }) => (
        <svg
            style={{
                marginLeft: 6,
                width: size,
                height: size,
                flexShrink: 0,
            }}
            xmlns="http://www.w3.org/2000/svg"
            height="48"
            viewBox="0 -960 960 960"
            width="48"
            fill="var(--ly-secondary)"
        >
            <path d="M220-80q-24.75 0-42.375-17.625T160-140v-434q0-24.75 17.625-42.375T220-634h70v-96q0-78.85 55.606-134.425Q401.212-920 480.106-920T614.5-864.425Q670-808.85 670-730v96h70q24.75 0 42.375 17.625T800-574v434q0 24.75-17.625 42.375T740-80H220Zm0-60h520v-434H220v434Zm260.168-140Q512-280 534.5-302.031T557-355q0-30-22.668-54.5t-54.5-24.5Q448-434 425.5-409.5t-22.5 55q0 30.5 22.668 52.5t54.5 22ZM350-634h260v-96q0-54.167-37.882-92.083-37.883-37.917-92-37.917Q426-860 388-822.083 350-784.167 350-730v96ZM220-140v-434 434Z" />
        </svg>
    ),
    Hamburger: () => (
        <svg width="30" height="30" viewBox="0 0 30 30" aria-hidden="true">
            <path
                stroke="var(--ly-primary)"
                strokeLinecap="round"
                strokeMiterlimit="10"
                strokeWidth="2"
                d="M4 7h22M4 15h22M4 23h22"
            ></path>
        </svg>
    ),
};

export default SVG;
