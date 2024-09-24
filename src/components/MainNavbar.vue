<script>
export default {
    data(){
        return {
            showMenu: false
        }
    },
    methods:{
        showMenuToggle(){
            if(this.showMenu){
                this.showMenu = !this.showMenu;
            }else{
                this.showMenu = !this.showMenu;
            }
        }
    }
}
</script>
<template>
    <nav class="fixed w-full mt-0 px-5 py-2 bg-transparent dark:bg-transparent fadedControls">
        <div class="container-fluid flex flex-wrap justify-between items-center mx-auto">
            <div class="flex items-center">
                <span class="self-center text-xl font-semibold whitespace-nowrap dark:text-white">musicGen</span>
            </div>
            <button @click="this.showMenuToggle" data-collapse-toggle="mobile-menu" type="button" class="inline-flex justify-center items-center ml-3 text-gray-400 rounded-lg md:hidden hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-300 dark:text-gray-400 dark:hover:text-white dark:focus:ring-gray-500" aria-controls="mobile-menu-2" aria-expanded="false">
                <span class="sr-only">Open main menu</span>
                <svg class="w-6 h-6" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"></path></svg>
            </button>
            <div :class="this.showMenu ? '':'hidden'" class="w-full md:block md:w-auto text-white" id="mobile-menu">
                <ul class="flex flex-col px-3 py-2 mt-4 bg-gray-50 rounded-lg border border-gray-100 md:flex-row md:space-x-8 md:mt-0 md:text-sm md:font-medium md:border-0 md:bg-white dark:bg-gray-800 md:dark:bg-gray-900 dark:border-gray-700">
                    <RouterLink :to="{ name: 'home'}" @click="this.showMenuToggle"><li class='flex align-content-center gap-2'>Home</li></RouterLink>
                    <!-- <RouterLink :to="{ name: 'home'}" @click="this.showMenuToggle"><li class='flex align-content-center gap-2'>Options</li></RouterLink> -->
                    <RouterLink :to="{ name: 'about'}" @click="this.showMenuToggle"><li class='flex align-content-center gap-2'>About</li></RouterLink>
                </ul>
            </div>
        </div>
    </nav>
</template>