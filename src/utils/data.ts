class Data {
    private _userAddress: string = "";
    private _manorName: string = "";

    /**
     * 获取本地存储的用户钱包地址
     */
    get userAddress(): string {
        return this._userAddress;
    }

    /**
     * 设置本地存储的用户钱包地址
     */
    set userAddress(_userAddress: string) {
        this._userAddress = _userAddress;
    }

    /**
     * 获取庄园名称
     */
    get manorName(): string {
        return this._manorName;
    }

    /**
     * 设置庄园名称
     */
    set manorName(_manorName: string) {
        this._manorName = _manorName;
    }

    /**
     * 获取当前支持的代币
     */
    get supportTokens(): {
        name: string;
        address: `0x${string}`;
        decimals: number;
    }[] {
        return [
            {
                name: "WLD",
                address: "0x2cFc85d8E48F8EAB294be644d9E25C3030863003",
                decimals: 18,
            },
            {
                name: "WBTC",
                address: "0x03C7054BCB39f7b2e5B2c7AcB37583e32D70Cfa3",
                decimals: 8,
            },
            {
                name: "WETH",
                address: "0x4200000000000000000000000000000000000006",
                decimals: 18,
            },
            {
                name: "uSOL",
                address: "0x9B8Df6E244526ab5F6e6400d331DB28C8fdDdb55",
                decimals: 18,
            },
            {
                name: "uXRP",
                address: "0x2615a94df961278DcbC41Fb0a54fEc5f10a693aE",
                decimals: 18,
            },
            {
                name: "uDOGE",
                address: "0x12E96C2BFEA6E835CF8Dd38a5834fa61Cf723736",
                decimals: 18,
            },
        ];
    }

    // 获取指定币种对应的token
    getTokenBySymbol(symbol: string): `0x${string}` | undefined {
        return this.supportTokens.find((token) => token.name == symbol)?.address;
    }

}
export const gData = new Data();
