# Session Isolation Test

Use this code to replicate our Session Isolation testing enviroment.

The code is:
- Serving HTML pages at http://localhost:9007
- Listening for POST messages

You can run this code directly from the source or by using the docker image.

## Running the code from the source

Install Golang: https://go.dev/doc/install

Download the modules:

```sh
go mod download
```

Run the code:
```sh
go run main.go
```

The server will be listening at port 9007.

## Using the docker image

Build the Docker image:
```sh
docker build -t session-isolation-test .
```

Run the Docker image:
```sh
docker run -p 9007:9007 -v $(pwd)/output/:/output/ --rm session-isolation-test
```

The server will be listening at port 9007.

## Test results

The output folder will contains the `output.log` file.

If you can see the effect of the tests in the page content and page titles as well.

### Page Content
Page content will contains a list of failed tests.

### Page Titles
Page titles (e.g. `TestPage1`) will get failed tests appended:

```sh
TestPage12 - CK/TestPage1- LS/TestPage1 - IDB/TestPage1
```

## Log format

```sh
IP X-Forwarded-For timestamp User-agent URL Tests
```

| Log field | Description |
| ------ | ------ |
| IP | Request IP (includes port if localhost) |
| X-Forwarded-For | Originating IP address when using a proxy to expose the server on the internet |
| timestamp | Timestamp of the request | 
| User-agent | User Agent of the request|
| URL | Page from where the POST message has been sent |
| Tests | List of failed test |


### Example #1

```sh
[::1]:58894 - 1664281928538 "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36" http://localhost:9007/testpage/1 []
```

| Log field | Value |
| ------ | ------ |
| IP | [::1]:58894 |
| X-Forwarded-For | - |
| timestamp | 1664281928538 | 
| User-agent |"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36" |
| URL | http://localhost:9007/testpage/1 |
| Tests | [] |

### Example #2

```sh
[::1]:58894 1.2.3.4 1664281928756 "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36" http://localhost:9007/testpage/1 [CK/TestPage2 CK/TestPage3 CK/TestPage4 LS/TestPage2 LS/TestPage3 LS/TestPage4]
```

| Log field | Value |
| ------ | ------ |
| IP | [::1]:57467 |
| X-Forwarded-For | 1.2.3.4 |
| timestamp | 1664281928538 | 
|User-agent | "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36" |
| URL | http://localhost:9007/testpage/1 |
| Tests | [CK/TestPage2 CK/TestPage3 CK/TestPage4 LS/TestPage2 LS/TestPage3 LS/TestPage4] |

## Test list format

Failed test have a standard format:

```sh
PREFIX/PAGEID
```

Here below is the list of all prefixes:

| Prefix | Description |
| ------ | ------ |
| CK | Cookie |
| IDB | IndexedDB |
| LS | LocalStorage |
| SS | SessionStorage |
| BC | Broadcast Channel |
| SW | Shared Worker |


For instance, the line of log below means that TestPage1 failed the tests for Cookies and LocalStorage.

```sh
[::1]:58894 1.2.3.4 1664281928756 "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36" http://localhost:9007/testpage/1 [CK/TestPage2 CK/TestPage3 CK/TestPage4 LS/TestPage2 LS/TestPage3 LS/TestPage4]
```

