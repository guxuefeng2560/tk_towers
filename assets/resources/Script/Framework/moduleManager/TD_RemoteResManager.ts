/**
 * 远程资源压缩包管理
 */
export default class RemoteResManager {
    static loadRemoteRes(url: string, callback: (err: Error, content: any) => void) {
        cc.assetManager.loadRemote(url, { ext: '.binary', cacheEnabled: true }, (err, texture) => {
            if (err) {
                callback(err, null);
            } else {
                this.unzip(texture).then((files) => {
                    callback(null, files);
                });
            }
        });
    }

    static unzip(content: any): Promise<{ [key: string]: JSZip.JSZipObject }> {
        const jsZip = new JSZip();
        return jsZip.loadAsync(content._buffer).then((zip: JSZip) => {
            return new Promise<{ [key: string]: JSZip.JSZipObject }>((resolve, reject) => {
                resolve(zip.files);
            });
        });
    }
}
