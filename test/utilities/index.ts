import { ethers } from "hardhat"
const { BigNumber } = require("ethers")

export const BASE_TEN = 10
export const ADDRESS_ZERO = "0x0000000000000000000000000000000000000000"

export function encodeParameters(types: any, values: any) {
    const abi = new ethers.utils.AbiCoder()
    return abi.encode(types, values)
}

export * from "./time"