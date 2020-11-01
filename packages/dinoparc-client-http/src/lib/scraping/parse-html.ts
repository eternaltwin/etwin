import { DomHandler, Node } from "domhandler";
import { Parser as HtmlParser } from "htmlparser2";

export async function parseHtml(html: string): Promise<Node[]> {
  return new Promise((resolve, reject) => {
    const handler: DomHandler = new DomHandler((err: Error | null, dom: Node[]) => {
      if (err !== null) {
        reject(err);
      } else {
        resolve(dom);
      }
    });
    const parser = new HtmlParser(handler, {xmlMode: true});
    parser.write(html);
    parser.end();
  });
}
