
export class IDGenerator {
    //消息ID,如果带入自增的ID，表示客户端要求服务端回复
    static msg_id: number = 1;

    private constructor() { }

    public static get(): number {
        return IDGenerator.msg_id++;
    }
}

/**
 * HTTP请求
 */
export abstract class NetBaseReq {
    msg_code: string;

    getMsgCode(): string {
        return this.msg_code;
    }

    // 将自己序列化为（JSON）字符串
    abstract serialize(): string;
}

/**
 * HTTP回应
 */
export abstract class NetBaseRespNtf {
    msg_code: string;
    // abstract Process();
    // 将（JSON）字符串反序列化填充给自己的变量
    abstract deserialize(msg: string): NetBaseRespNtf;
    // 将（JSON对象）反序列化填充给自己的变量
    abstract deserializeFromObj(msg: object): NetBaseRespNtf;
}

/**
 * 网络请求错误信息
 */
export class NetMessageError {
    // 错误码,如果没有错误则为0
    err: number;
    // 错误提示，如果没有错误则为""
    message: string;

    constructor(err: number, message: string) {
        this.err = err;
        this.message = message;
    }
}
