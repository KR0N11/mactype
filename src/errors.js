// Domain errors. Every impossible transition gets a name the UI can branch on.

export class TypingError extends Error {}

export class InvalidTargetError extends TypingError {}

export class InvalidKeystrokeError extends TypingError {}

export class InvalidTimestampError extends TypingError {}

export class NothingToDeleteError extends TypingError {}

export class SessionCompleteError extends TypingError {}

export class UnmeasurableSessionError extends TypingError {}
