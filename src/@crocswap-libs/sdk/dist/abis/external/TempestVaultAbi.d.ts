export declare const TEMPEST_VAULT_ABI: ({
    type: string;
    stateMutability: string;
    name?: undefined;
    inputs?: undefined;
    outputs?: undefined;
    anonymous?: undefined;
} | {
    type: string;
    name: string;
    inputs: {
        name: string;
        type: string;
        internalType: string;
    }[];
    outputs: {
        name: string;
        type: string;
        internalType: string;
    }[];
    stateMutability: string;
    anonymous?: undefined;
} | {
    type: string;
    name: string;
    inputs: never[];
    outputs: {
        name: string;
        type: string;
        internalType: string;
        components: {
            name: string;
            type: string;
            internalType: string;
        }[];
    }[];
    stateMutability: string;
    anonymous?: undefined;
} | {
    type: string;
    name: string;
    inputs: {
        name: string;
        type: string;
        indexed: boolean;
        internalType: string;
    }[];
    anonymous: boolean;
    stateMutability?: undefined;
    outputs?: undefined;
} | {
    type: string;
    name: string;
    inputs: {
        name: string;
        type: string;
        internalType: string;
    }[];
    stateMutability?: undefined;
    outputs?: undefined;
    anonymous?: undefined;
})[];
