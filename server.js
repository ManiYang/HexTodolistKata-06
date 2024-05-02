const http = require("http");
const { v4: uuidv4 } = require("uuid");

const httpListenPort = process.env.PORT || 3005;

const responseHeaders = {
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Content-Length, X-Requested-With',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'PATCH, POST, GET,OPTIONS,DELETE',
    'Content-Type': 'application/json'
};

/**
 * Sends "successful" response.
 * @param res 
 * @param data If is not `null`, this is the value of key "data" in the response body. If is `null`, the response has no body.
 */
function respondAsSuccessful(res, data) {
    res.writeHead(200, responseHeaders);
    if (data !== null) {
        res.write(JSON.stringify({
            status: "sucessful",
            data: data
        }));
    }
    res.end();
}

function respondAsFailed(res, statusCode, message) {
    res.writeHead(statusCode, responseHeaders);
    res.write(JSON.stringify({
        status: "failed",
        message: message
    }));
    res.end();
}

function getTitleFromReqBody(body) {
    const title = JSON.parse(body).title;
    if (title === undefined) {
        throw new Error("title 未填寫");
    }
    return title;
}

const todos = [];

function findTodoIndexById(todoList, id) {
    const index = todoList.findIndex((item) => item.id === id);
    if (index === -1) {
        throw new Error("找不到該 todo");
    }
    return index;
}

function httpListener(req, res) {
    let body = "";
    req.on("data", (chunck) => { 
        body += chunck; 
    });

    if (req.url === "/todos" && req.method === "GET") {
        respondAsSuccessful(res, todos);
    }
    else if (req.url === "/todos" && req.method === "POST") {
        req.on("end", () => {
            try {
                const title = getTitleFromReqBody(body);
                const id = uuidv4();
                todos.push({ title, id });
                respondAsSuccessful(res, todos);
            } catch (error) {
                respondAsFailed(res, 400, error.message);
            }
        });
    }
    else if (req.url === "/todos" && req.method === "DELETE") {
        todos.length = 0;
        respondAsSuccessful(res, todos);
    }
    else if (req.url.startsWith("/todos/") && req.method === "DELETE") {
        try {
            const id = req.url.split("/").pop();
            const index = findTodoIndexById(todos, id);
            todos.splice(index, 1);
            respondAsSuccessful(res, todos);
        } catch (error) {
            respondAsFailed(res, 400, error.message);
        }
    }
    else if (req.url.startsWith("/todos/") && req.method === "PATCH") {
        req.on("end", () => {
            try {
                const title = getTitleFromReqBody(body);

                const id = req.url.split("/").pop();
                const index = findTodoIndexById(todos, id);

                todos[index].title = title;

                respondAsSuccessful(res, todos);
            } catch (error) {
                respondAsFailed(res, 400, error.message);
            }
        });
    }
    else if (req.method === "OPTIONS") {
        respondAsSuccessful(res, null);
    }
    else {
        respondAsFailed(res, 404, "無此路由");
    }
}

http.createServer(httpListener).listen(httpListenPort);
