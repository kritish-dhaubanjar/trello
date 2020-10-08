export default {
  template: `
    <div class="container-fluid">
      <div class="row pt-4">
        <!-- -->

        <div class="col px-1" v-for="(type,index) in types" :key="index">
          <div class="card">
            <div class="card-header font-weight-bold pb-2">{{type.name}}</div>
            <div class="card-body px-2 pt-0 pb-0 parent" :data-slug="type.slug"  :data-name="type.name">
              <div
                class="card mb-2 child"
                v-for="(child, index) in type.childs"
                draggable="true"
                @click="show(child)"
              >
                <div class="card-body py-2">
                  <!--<span class="badge badge-primary">Minor Bug</span>-->
                  <p class="mb-0">{{child}}</p>
                </div>
              </div>
            </div>
            <div class="card-body p-2 actions" v-if="card.active != type.slug">
              <button
                class="btn btn-light btn-block"
                @click="card.active = type.slug"
              >
                + Add another card
              </button>
            </div>
            <div class="card-body p-2 actions" v-else>
              <textarea
                class="form-control mb-1"
                rows="2"
                v-model="card.value"
              ></textarea>
              <button
                class="btn btn-success"
                :disabled="card.value.length==0"
                @click="add(index)"
              >
                Add Card
              </button>
              <span aria-hidden="true" class="close" @click="reset"
                >&times;</span
              >
            </div>
          </div>
        </div>

        <!-- -->

        <div class="col px-1">
          <div class="card add-another-list">
            <button class="btn btn-dark translucent btn-block" v-if="!addAnotherList.toggle" @click="addAnotherList.toggle = true">+ Add another list</button>
            <div class="card-body p-2 actions" v-else>
              <textarea
                class="form-control mb-2"
                rows="1"
                placeholder="Enter list title..."
                v-model="addAnotherList.value"
              ></textarea>
              <button
                class="btn btn-success"
                :disabled="addAnotherList.value.length==0"
                @click="addAnotherListToTypes"
              >
                Add Card
              </button>
              <span aria-hidden="true" class="close" @click="addAnotherList.toggle = false"
                >&times;</span
              >
            </div>
          </div>
        </div>
      </div>
    </div>
  `,

  data() {
    return {
      card: {
        active: "",
        value: "",
      },
      addAnotherList: {
        toggle: false,
        value: "",
      },
      types: [],
    };
  },

  //
  created() {
    let sections = window.location.pathname.split("/");
    let slug = sections.pop();
    fetch(this.$api + "/" + slug)
      .then((res) => res.json())
      .then((res) => {
        this.types = res.board;
      })
      .then(() => {
        this.addEventListener();
      });
  },

  methods: {
    add(index) {
      this.types[index].childs.push(this.card.value);
      setTimeout(() => {
        this.addEventListener();
        this.update();
      }, 0);
      this.reset();
    },

    reset() {
      this.card.value = "";
      this.card.active = "";
    },

    show(card) {
      console.log(card);
    },

    addAnotherListToTypes() {
      let slug = "";
      let index = -1;
      do {
        index = -1;
        slug =
          this.addAnotherList.value.toLocaleLowerCase().replaceAll(" ", "_") +
          "_" +
          Math.floor(Math.random() * 99999);
        index = this.types.findIndex((type) => type.slug == slug);
      } while (index > 0);
      this.types.push({
        name: this.addAnotherList.value,
        slug,
        childs: [],
      });
      this.addAnotherList.value = "";
      this.addAnotherList.toggle = false;
      setTimeout(() => {
        this.addEventListener();
        this.update();
      }, 0);
    },

    //
    update() {
      let sections = window.location.pathname.split("/");
      let slug = sections.pop();
      fetch(this.$api + "/" + slug, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(this.updateOrder()),
      });
    },

    updateOrder() {
      const containers = document.querySelectorAll(".parent");
      let types = [];
      containers.forEach((container) => {
        let type = {
          name: container.dataset.name,
          slug: container.dataset.slug,
          childs: [],
        };
        let draggables = container.querySelectorAll(".child");
        draggables.forEach((child) => {
          type.childs.push(child.innerText);
        });
        types.push(type);
      });
      return types;
    },
    //

    addEventListener() {
      const draggables = document.querySelectorAll(".child");
      const containers = document.querySelectorAll(".parent");

      draggables.forEach((draggable) => {
        draggable.addEventListener("dragstart", () =>
          draggable.classList.add("active")
        );

        draggable.addEventListener("dragend", () => {
          draggable.classList.remove("active");
          this.update();
        });
      });

      containers.forEach((container) => {
        container.addEventListener("dragover", (e) => {
          e.preventDefault();
          const afterElement = this.getDragAfterElement(container, e.clientY);
          const draggable = document.querySelector(".active");
          if (!afterElement) container.appendChild(draggable);
          else container.insertBefore(draggable, afterElement);
        });
      });
    },

    getDragAfterElement(container, clientY) {
      const draggables = [...container.querySelectorAll(".child:not(.active)")];

      return draggables.reduce(
        (closest, child) => {
          const box = child.getBoundingClientRect();
          const offset = clientY - box.top - box.height / 2;
          if (offset < 0 && offset > closest.offset)
            return { offset: offset, element: child };
          else return closest;
        },
        { offset: Number.NEGATIVE_INFINITY }
      ).element;
    },
  },

  watch: {
    "card.active": function () {
      this.card.value = "";
    },
  },
};
