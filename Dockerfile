FROM golang:alpine AS build

# Set the Current Working Directory inside the container
WORKDIR /

# We want to populate the module cache based on the go.{mod,sum} files.
COPY go.mod .
COPY go.sum .

# Download modules
RUN go mod download

# Copy all GO files in the working directory
COPY *.go ./

# Build the Go app
RUN CGO_ENABLED=0 go build -o ./bin/session-isolation-test .

# Build the final image from scratch
FROM scratch

# Copy the Go app from the build image
COPY --from=build /bin/session-isolation-test ./bin/session-isolation-test

# Copy templates and static files
COPY ./static ./static
COPY ./templates ./templates

# This container exposes port 9007
EXPOSE 9007

# Run the binary
CMD ["/bin/session-isolation-test"]