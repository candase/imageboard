(function () {
    var moreCount = 0;

    Vue.component("modal-image", {
        props: ["modalimageid", "modalimageinfo"],
        data: function () {
            return {
                newComment: null,
                comment: "",
                username: "",
                image_id: "",
            };
        },
        template: "#modal-temp",
        mounted: function () {
            console.log(this);
        },
        methods: {
            commentUpload: function (e) {
                e.preventDefault();
                var self = this;
                if (this.comment == "") {
                    this.comment = "no comment!";
                }
                if (this.username == "") {
                    this.username = "anon";
                }

                var created = new Date();
                var created_at = created.toUTCString();

                var newComment = [
                    {
                        comment: this.comment,
                        username: this.username,
                        image_id: this.modalimageinfo.id,
                        created_at: created_at,
                    },
                ];
                this.comment = "";
                this.username = "";
                axios.post("/addComment", newComment).then(function (response) {
                    console.log("response", response);
                    if (self.newComment == null) {
                        self.newComment = newComment;
                    } else {
                        self.newComment = self.newComment
                            .concat(response.data)
                            .reverse();
                    }
                });
                var previousButton = document.getElementById("previous_image");
                var nextButton = document.getElementById("next_image");
                document.addEventListener("click", function (e) {
                    if (e.target == previousButton || e.target == nextButton) {
                        self.newComment = null;
                    }
                });
            },
            closeModal: function () {
                this.$emit("close");
            },

            deleteImgComp: function () {
                this.$emit("delete-img");
            },
        },
    });

    new Vue({
        el: "#main",
        data: {
            images: [],
            title: "",
            description: "",
            username: "",
            file: null,
            modalimageid: "",
            modalimageinfo: {},
            moreimagesuploaded: false,
            imagedeleted: false,
            imageuploading: false,
            imageuploaded: false,
        },
        mounted: function () {
            var self = this;
            console.log("location hash:", location.hash);
            self.modalimageid = location.hash.slice(1);
            axios.get("/images").then(function (response) {
                self.images = response.data;
            });
            window.addEventListener("hashchange", function () {
                self.modalimageid = location.hash.slice(1);
            });
            var checkForNewImages = function () {
                axios.get("/check").then(function (result) {
                    if (self.images[0].id != result.data[0].id) {
                        self.moreimagesuploaded = true;
                        return;
                    }
                });
                setTimeout(checkForNewImages, 5000);
            };
            setTimeout(checkForNewImages, 5000);
        },
        watch: {
            modalimageid: function () {
                var self = this;
                if (self.modalimageid == "") {
                    location.hash = "";
                    var h1 = document.getElementById("heading1");
                    var forms = document.getElementById("upload");
                    var allImages = document.getElementById("allImages");
                    var body = document.querySelector("body");
                    // var backImg = document.querySelector("img.background");
                    h1.style.opacity = "1";
                    forms.style.opacity = "1";
                    allImages.style.opacity = "1";
                    body.style.backgroundColor = "rgb(252, 246, 223)";
                    body.style.overflowY = "visible";
                    return;
                }
                var sendImageId = {
                    modalImageId: self.modalimageid,
                };

                axios.post(`/modal`, sendImageId).then(function (result) {
                    if (result.data.noImage) {
                        self.modalimageid = "";
                        return;
                    }
                    self.modalimageinfo = result.data;
                    var uploadForm = document.querySelector("form#upload");
                    var divImages = document.getElementById("allImages");
                    var body = document.querySelector("body");
                    window.onclick = function (e) {
                        if (
                            e.target == uploadForm ||
                            e.target == divImages ||
                            e.target == body
                        ) {
                            location.hash = "";
                        }
                    };

                    var previousImg = document.getElementById("previous_image");
                    if (result.data.previous_image == null) {
                        var previousImgId = null;
                        previousImg.style.color = "gray";
                    } else {
                        previousImgId = result.data.previous_image.toString();
                    }
                    var nextImg = document.getElementById("next_image");
                    if (result.data.next_image == null) {
                        var nextImgId = null;
                        nextImg.style.color = "gray";
                    } else {
                        nextImgId = result.data.next_image.toString();
                    }
                    var h1 = document.getElementById("heading1");
                    var forms = document.getElementById("upload");
                    var allImages = document.getElementById("allImages");

                    h1.style.opacity = "0.5";
                    forms.style.opacity = "0.5";
                    allImages.style.opacity = "0.5";
                    body.style.backgroundColor = "gray";
                    body.style.overflowY = "hidden";

                    previousImg.addEventListener("click", function (e) {
                        if (previousImgId == null) {
                            location.hash = self.modalimageid;
                        } else {
                            location.hash = `#${previousImgId}`;
                            nextImg.style.color = "white";
                        }
                    });
                    nextImg.addEventListener("click", function (e) {
                        if (nextImgId == null) {
                            location.hash = self.modalimageid;
                        } else {
                            location.hash = `#${nextImgId}`;
                            previousImg.style.color = "white";
                        }
                    });
                });
            },
        },
        methods: {
            handleUpload: function (e) {
                e.preventDefault();
                var formData = new FormData();
                formData.append("title", this.title);
                formData.append("description", this.description);
                formData.append("username", this.username);
                formData.append("file", this.file);

                var self = this;

                axios
                    .post("/upload", formData)
                    .then(function (response) {
                        self.images.unshift(response.data);
                        self.imageuploading = false;
                        self.imageuploaded = true;
                        setTimeout(function () {
                            self.imageuploaded = false;
                        }, 5000);
                    })
                    .catch(function (err) {
                        console.log("error in POST /upload", err);
                    });
                this.title = "";
                this.description = "";
                this.username = "";
                document.getElementById("file_uploader").value = "";
                self.imageuploading = true;
            },
            handleChange: function (e) {
                this.file = e.target.files[0];
            },
            more: function (e) {
                e.preventDefault();
                var self = this;
                var lastId = [
                    {
                        lastId: self.images[self.images.length - 1].id,
                    },
                ];
                axios
                    .post("/more", lastId)
                    .then(function (response) {
                        var newImages = response.data.slice(0, -1);
                        self.images = self.images.concat(newImages);
                        var lastPhotoId =
                            response.data[response.data.length - 1].id;
                        if (
                            self.images[self.images.length - 1].id ==
                            lastPhotoId
                        ) {
                            e.target.disabled = true;
                            e.target.innerHTML = "here is the end of images :(";
                        }
                    })
                    .catch(function (err) {
                        console.log("error in POST /more:", err);
                    });
            },

            closeMe: function () {
                this.modalimageid = "";
                location.hash = "";
                var h1 = document.getElementById("heading1");
                var forms = document.getElementById("upload");
                var allImages = document.getElementById("allImages");
                var body = document.querySelector("body");
                h1.style.opacity = "1";
                forms.style.opacity = "1";
                allImages.style.opacity = "1";
                body.style.backgroundColor = "rgb(252, 246, 223)";
                body.style.overflowY = "visible";
            },

            deleteImg: function () {
                var self = this;
                var deleteImgId = {
                    id: location.hash.slice(1),
                };
                axios.post("/delete", deleteImgId).then(function (response) {
                    location.hash = "";
                    for (var i = 0; i < self.images.length; i++) {
                        if (self.images[i].id == deleteImgId.id) {
                            self.images.splice(i, 1);
                        }
                    }
                    self.imagedeleted = true;
                    setTimeout(function () {
                        self.imagedeleted = false;
                    }, 5000);
                });
            },
        },
    });
})();
