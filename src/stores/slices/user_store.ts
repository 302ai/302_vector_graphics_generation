import { ICustomColors } from "@/api/indexDB/ColorsDB";
import { atomWithStorage, createJSONStorage } from "jotai/utils";
import { IFinishedProduct } from "@/api/indexDB/FinishedProductDB";

export type Color = { r: number; g: number; b: number; a: number };

type UserState = {
    // menuTab 1:Generate vector graphics 2:Vector graphics to generate video
    menuTab: 1 | 2;
    // Text generation vector graphics parameters
    vectorGraphic: {
        prompt: string,
        image_size: string,
        style: string,
        colorAuto: boolean,
        colors: Color[],
        colorsId: number | string,
    };
    // Custom color
    customColors: ICustomColors[];

    // Vector graph generation result
    vectorGraphData: IFinishedProduct[];

    // Generate video with a minimum of 1 second and a maximum of 15 seconds
    duration: number;

    // optimize prompt words
    optimize: boolean;

    // SVG image address
    svgUrl?: string;
};

export const userAtom = atomWithStorage<UserState>(
    "userAtom",
    {
        menuTab: 1,
        vectorGraphic: {
            prompt: '',
            colors: [],
            colorsId: 0,
            colorAuto: true,
            style: 'vector_illustration',
            image_size: '1024x1024',
        },
        customColors: [],
        vectorGraphData: [],
        duration: 5,
        svgUrl: '',
        optimize: false
    },
    createJSONStorage(() =>
        typeof window !== "undefined"
            ? sessionStorage
            : {
                getItem: () => null,
                setItem: () => null,
                removeItem: () => null,
            }
    ),
    {
        getOnInit: true,
    }
);
