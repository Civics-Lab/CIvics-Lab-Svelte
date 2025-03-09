<script lang="ts">
    export let name = '';
    export let title = '';
    export let image = '';
    export let location = '';
  </script>
  
  <div class="flex flex-col gap-2">
    <img 
      src={image} 
      alt={name} 
      class="w-36 h-36 aspect-square object-cover rounded-full" 
    />
    <div class="flex flex-col gap-1">
      <h3 class="text-xl font-bold text-slate-950">{name}</h3>
      <p class="text-sm text-slate-600 font-semibold">{title}</p>
      <p class="text-xs text-slate-400 font-bold uppercase">{location}</p>
    </div>
  </div>