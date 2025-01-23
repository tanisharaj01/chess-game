const socket = io();
const chess = new Chess(); // Initialize new chess game instance
const boardElement = document.querySelector(".chessboard");

let draggedPiece = null;
let sourceSquare = null; // From where the piece is dragged
let playerRole = null; // Whether the player is white or black

const renderBoard = () => {
    const board = chess.board();
    boardElement.innerHTML = "";
    board.forEach((row, rowIndex) => {
        row.forEach((square, squareIndex) => {
            const squareElement = document.createElement("div");
            squareElement.classList.add("square", (rowIndex + squareIndex) % 2 === 0 ? "light" : "dark");
            squareElement.dataset.row = rowIndex;
            squareElement.dataset.square = squareIndex;

            if (square) {
                const pieceElement = document.createElement("div");
                pieceElement.classList.add("piece", square.color === "w" ? "white" : "black");
                pieceElement.innerText = getPieceUnicode(square);
                pieceElement.draggable = playerRole === square.color;

                pieceElement.addEventListener("dragstart", (e) => {
                    if (pieceElement.draggable) {
                        draggedPiece = pieceElement;
                        sourceSquare = { row: rowIndex, square: squareIndex };
                        e.dataTransfer.setData("text/plain", ""); // To make it draggable without any issue
                    }
                });

                pieceElement.addEventListener("dragend", () => {
                    draggedPiece = null; // Reset after dragging
                    sourceSquare = null;
                });

                squareElement.appendChild(pieceElement); // Attach piece to the square
            }

            squareElement.addEventListener("dragover", (e) => {
                e.preventDefault();
            });

            squareElement.addEventListener("drop", (e) => {
                e.preventDefault();

                if (draggedPiece) {
                    const targetSquare = {
                        row: parseInt(squareElement.dataset.row),
                        square: parseInt(squareElement.dataset.square),
                    };
                    handleMove(sourceSquare, targetSquare);
                }
            });

            boardElement.appendChild(squareElement);
        });
    });
};

const handleMove = (source, target) => {
    const move = {
        from: `${String.fromCharCode(97 + source.square)}${8 - source.row}`,
        to: `${String.fromCharCode(97 + target.square)}${8 - target.row}`,
        promotion: "q", // Default promotion to queen
    };
    socket.emit("move", move);
};

const getPieceUnicode = (piece) => {
    const unicodePieces = {
        p: "♟",
        r: "♜",
        n: "♞",
        b: "♝",
        q: "♛",
        k: "♚",
        P: "♙",
        R: "♖",
        N: "♘",
        B: "♗",
        Q: "♕",
        K: "♔",
    };
    return unicodePieces[piece.type] || ""; // If piece type is not found, return empty string
};

socket.on("playerRole", (role) => {
    playerRole = role;
    renderBoard();
});

socket.on("spectatorRole", () => {
    playerRole = null;
    renderBoard();
});

socket.on("boardState", (fen) => {
    chess.load(fen);
    renderBoard();
});

socket.on("move", (move) => {
    chess.move(move);
    renderBoard();
});

renderBoard();
