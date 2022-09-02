FROM golang:1.18-alpine AS build_base

# Set the Current Working Directory inside the container
WORKDIR /

# We want to populate the module cache based on the go.{mod,sum} files.
COPY go.mod .
COPY go.sum .

RUN go mod download

COPY . .

# Build the Go app
RUN CGO_ENABLED=0 go build -o ./bin/session-isolation-test .

# This container exposes port 9007 to the outside world
EXPOSE 9007

# Run the binary program
CMD ["/bin/session-isolation-test"]