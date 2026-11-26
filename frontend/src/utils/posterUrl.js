import api from "../services/api";

export const resolvePosterUrl = (posterImage) => {
    if (!posterImage) return "";
    if (posterImage.startsWith("http://") || posterImage.startsWith("https://")) {
        return posterImage;
    }
    const base = api.defaults.baseURL || "";
    const origin = base.replace(/\/api\/?$/, "");
    return `${origin}${posterImage.startsWith("/") ? posterImage : `/${posterImage}`}`;
};
