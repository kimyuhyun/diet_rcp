
export default () => {
    return (
        <div className="d-flex align-items-center justify-content-center vh-100">
            <div className="row m-0">
                <div className="col-12 col-md-6">
                    <img
                        src="https://cdn.pixabay.com/photo/2017/03/09/12/31/error-2129569__340.jpg"
                        className="img-fluid"
                    />
                </div>
                <div className="col-12 col-md-6 d-flex flex-column align-self-center">
                    <p className="fs-3">
                        {" "}
                        <span className="text-danger">Opps!</span> Page not found.
                    </p>
                    <p className="lead">The page you’re looking for doesn’t exist.</p>
                    <a href="/" className="btn btn-primary">
                        Go Home
                    </a>
                </div>
            </div>
        </div>
    );
};
