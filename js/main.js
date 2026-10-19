var fullNameInput = document.getElementById("fullNameInput");
var phoneInput = document.getElementById("phoneInput");
var emailInput = document.getElementById("emailInput");
var addressInput = document.getElementById("addressInput");
var groupInput = document.getElementById("groupInput");
var notesInput = document.getElementById("notesInput");
var isFavoriteInput = document.getElementById("isFavoriteInput");
var isEmergencyInput = document.getElementById("isEmergencyInput");

var searchInput = document.getElementById("searchInput");
var btnAdd = document.getElementById("btnAdd");
var btnUpdate = document.getElementById("btnUpdate");

var currentIndex;
var contactList = [];
var uploadedPhotoData = "";


if (localStorage.getItem("contactContainer") !== null) {
    contactList = JSON.parse(localStorage.getItem("contactContainer"));
    displayData();
}

function openAddModal() {
    clearForm();
    btnAdd.classList.remove("d-none");
    btnUpdate.classList.add("d-none");
    document.getElementById("modalTitle").innerText = "Add New Contact";
    uploadedPhotoData = "";
    updateModalPreview();
    var myModal = new bootstrap.Modal(document.getElementById('contactModal'));
    myModal.show();
}

// photo selection
function handlePhotoUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            uploadedPhotoData = e.target.result;
            updateModalPreview();
        }
        reader.readAsDataURL(file);
    }
}

// modal
function updateModalPreview() {
    const previewContainer = document.getElementById("modalAvatarPreview");
    const name = fullNameInput.value.trim();

    if (uploadedPhotoData !== "") {
        previewContainer.innerHTML = `<img src="${uploadedPhotoData}" alt="Preview">`;
    } else if (name !== "") {
        const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
        previewContainer.innerHTML = initials;
        previewContainer.style.backgroundColor = stringToColor(name);
    } else {
        previewContainer.innerHTML = `<i class="fa-solid fa-user"></i>`;
    }
}

// add
function addContact() {
    if (validationName() && validationPhone()) {
        var contact = {
            name: fullNameInput.value,
            phone: phoneInput.value,
            email: emailInput.value,
            address: addressInput.value,
            group: groupInput.value,
            notes: notesInput.value,
            image: uploadedPhotoData,
            isFavorite: isFavoriteInput.checked,
            isEmergency: isEmergencyInput.checked
        };

        contactList.push(contact);
        localStorage.setItem("contactContainer", JSON.stringify(contactList));
        displayData();
        clearForm();

        Swal.fire({
            icon: 'success',
            title: 'Success!',
            text: 'Contact has been added successfully.',
            timer: 1500,
            showConfirmButton: false
        });

        var modalEl = bootstrap.Modal.getInstance(document.getElementById('contactModal'));
        modalEl.hide();
    } else {
        Swal.fire({
            icon: 'error',
            title: 'Invalid Data',
            text: 'Please check required fields formatting.',
            confirmButtonColor: '#6366f1'
        });
    }
}

// display
function displayData() {
    var term = searchInput.value;
    var initial = "";

    for (var i = 0; i < contactList.length; i++) {
        if (contactList[i].name.toLowerCase().includes(term.toLowerCase()) ||
            contactList[i].phone.toLowerCase().includes(term.toLowerCase())) {

            var initials = contactList[i].name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
            var randomBg = stringToColor(contactList[i].name);
            var avatarContent = contactList[i].image
                ? `<img src="${contactList[i].image}" alt="${contactList[i].name}">`
                : initials;

            initial += `
                        <div class="col-md-6">
                            <div class="contact-card p-3 position-relative">
                                <div class="d-flex align-items-center gap-3 mb-3">
                                    <div class="avatar-circle" style="background-color: ${randomBg};">
                                        ${avatarContent}
                                        ${contactList[i].isFavorite ? '<span class="badge-fav"><i class="fa-solid fa-star" style="font-size:9px;"></i></span>' : ''}
                                        ${contactList[i].isEmergency && !contactList[i].isFavorite ? '<span class="badge-emergency"><i class="fa-solid fa-heart-pulse" style="font-size:9px;"></i></span>' : ''}
                                    </div>
                                    <div class="overflow-hidden">
                                        <h6 class="fw-bold m-0 text-dark text-truncate">${contactList[i].name}</h6>
                                        <div class="text-muted small d-flex align-items-center gap-1 mt-1">
                                            <i class="fa-solid fa-phone text-primary" style="font-size: 0.8rem;"></i>
                                            <span>${contactList[i].phone}</span>
                                        </div>
                                        ${contactList[i].email ? `<div class="text-muted small text-truncate"><i class="fa-solid fa-envelope me-1 text-muted"></i>${contactList[i].email}</div>` : ''}
                                    </div>
                                </div>
                                
                                ${contactList[i].isEmergency ? '<div class="mb-2"><span class="badge bg-danger-subtle text-danger px-2 py-1 rounded-pill" style="font-size:0.7rem;"><i class="fa-solid fa-heart-pulse me-1"></i>Emergency</span></div>' : ''}

                                <div class="d-flex align-items-center justify-content-between pt-2 border-top">
                                    <div class="d-flex gap-2">
                                        <a href="tel:${contactList[i].phone}" class="btn btn-sm btn-light text-success rounded-circle p-2" title="Call">
                                            <i class="fa-solid fa-phone"></i>
                                        </a>
                                    </div>
                                    <div class="d-flex gap-1">
                                        <button class="btn btn-sm btn-light text-muted rounded-circle p-2" onclick="toggleFavorite(${i})" title="Favorite">
                                            <i class="fa-${contactList[i].isFavorite ? 'solid' : 'regular'} fa-star ${contactList[i].isFavorite ? 'text-warning' : ''}"></i>
                                        </button>
                                        <button class="btn btn-sm btn-light text-muted rounded-circle p-2" onclick="toggleEmergency(${i})" title="Emergency">
                                            <i class="fa-solid fa-heart-pulse ${contactList[i].isEmergency ? 'text-danger' : ''}"></i>
                                        </button>
                                        <button class="btn btn-sm btn-light text-muted rounded-circle p-2" onclick="setUpdateInfo(${i})" title="Edit">
                                            <i class="fa-solid fa-pen"></i>
                                        </button>
                                        <button class="btn btn-sm btn-light text-muted rounded-circle p-2" onclick="deleteItem(${i})" title="Delete">
                                            <i class="fa-solid fa-trash"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
        }
    }

    document.getElementById("rowData").innerHTML = initial;
    updateStats();
}

// delete
function deleteItem(x) {
    Swal.fire({
        title: 'Are you sure?',
        text: "Are you sure you want to delete this contact?",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#cbd5e1',
        confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
        if (result.isConfirmed) {
            contactList.splice(x, 1);
            localStorage.setItem("contactContainer", JSON.stringify(contactList));
            displayData();
            Swal.fire({
                icon: 'success',
                title: 'Deleted!',
                text: 'Contact has been deleted.',
                timer: 1200,
                showConfirmButton: false
            });
        }
    });
}

// setupdate
function setUpdateInfo(index) {
    currentIndex = index;
    document.getElementById("modalTitle").innerText = "Update Contact";

    fullNameInput.value = contactList[index].name;
    phoneInput.value = contactList[index].phone;
    emailInput.value = contactList[index].email;
    addressInput.value = contactList[index].address;
    groupInput.value = contactList[index].group;
    notesInput.value = contactList[index].notes;
    uploadedPhotoData = contactList[index].image;
    isFavoriteInput.checked = contactList[index].isFavorite;
    isEmergencyInput.checked = contactList[index].isEmergency;

    updateModalPreview();

    btnAdd.classList.add("d-none");
    btnUpdate.classList.remove("d-none");

    var myModal = new bootstrap.Modal(document.getElementById('contactModal'));
    myModal.show();
}

// update
function updateData() {
    var contact = {
        name: fullNameInput.value,
        phone: phoneInput.value,
        email: emailInput.value,
        address: addressInput.value,
        group: groupInput.value,
        notes: notesInput.value,
        image: uploadedPhotoData,
        isFavorite: isFavoriteInput.checked,
        isEmergency: isEmergencyInput.checked
    };

    contactList.splice(currentIndex, 1, contact);
    localStorage.setItem("contactContainer", JSON.stringify(contactList));
    displayData();
    clearForm();

    btnAdd.classList.remove("d-none");
    btnUpdate.classList.add("d-none");

    Swal.fire({
        icon: 'success',
        title: 'Updated!',
        text: 'Contact has been updated successfully.',
        timer: 1500,
        showConfirmButton: false
    });

    var modalEl = bootstrap.Modal.getInstance(document.getElementById('contactModal'));
    modalEl.hide();
}

function toggleFavorite(i) {
    contactList[i].isFavorite = !contactList[i].isFavorite;
    localStorage.setItem("contactContainer", JSON.stringify(contactList));
    displayData();
}

function toggleEmergency(i) {
    contactList[i].isEmergency = !contactList[i].isEmergency;
    localStorage.setItem("contactContainer", JSON.stringify(contactList));
    displayData();
}

function clearForm() {
    fullNameInput.value = "";
    phoneInput.value = "";
    emailInput.value = "";
    addressInput.value = "";
    groupInput.value = "";
    notesInput.value = "";
    uploadedPhotoData = "";
    isFavoriteInput.checked = false;
    isEmergencyInput.checked = false;
    fullNameInput.classList.remove("is-valid", "is-invalid");
    phoneInput.classList.remove("is-valid", "is-invalid");
}

function updateStats() {
    document.getElementById("totalCount").innerText = contactList.length;
    document.getElementById("favoritesCount").innerText = contactList.filter(c => c.isFavorite).length;
    document.getElementById("emergencyCount").innerText = contactList.filter(c => c.isEmergency).length;
    document.getElementById("contactsSubtitle").innerText = `Manage and organize your ${contactList.length} contacts`;

    const favorites = contactList.filter(c => c.isFavorite);
    const emergencies = contactList.filter(c => c.isEmergency);

    document.getElementById("favoritesList").innerHTML = favorites.length === 0
        ? `<p class="text-muted text-center py-3 m-0" style="font-size: 0.85rem;">No favorites yet</p>`
        : favorites.map(c => `<div class="p-2 mb-2 bg-light rounded">${c.name} (${c.phone})</div>`).join('');

    document.getElementById("emergencyList").innerHTML = emergencies.length === 0
        ? `<p class="text-muted text-center py-3 m-0" style="font-size: 0.85rem;">No emergency contacts</p>`
        : emergencies.map(c => `<div class="p-2 mb-2 bg-white border border-danger-subtle rounded">${c.name} (${c.phone})</div>`).join('');
}

function validationName() {
    var regex = /^[A-Za-z\s]{2,50}$/;
    if (regex.test(fullNameInput.value)) {
        fullNameInput.classList.add("is-valid");
        fullNameInput.classList.remove("is-invalid");
        return true;
    } else {
        fullNameInput.classList.add("is-invalid");
        fullNameInput.classList.remove("is-valid");
        return false;
    }
}

function validationPhone() {
    var regex = /^(01)[0-2,5]{1}[0-9]{8}$/;
    if (regex.test(phoneInput.value)) {
        phoneInput.classList.add("is-valid");
        phoneInput.classList.remove("is-invalid");
        return true;
    } else {
        phoneInput.classList.add("is-invalid");
        phoneInput.classList.remove("is-valid");
        return false;
    }
}

function stringToColor(str) {
    const colors = ['#ec4899', '#8b5cf6', '#6366f1', '#3b82f6', '#10b981', '#f59e0b'];
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
}