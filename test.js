
const path = require('path');
const fs = require('fs');
const os = require('os');
const Viewer = require(path.resolve("./main/businesses/Viewer.js"));

// Xử lý ngoại lệ không bắt được
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception in child process:', error, (new Date().toLocaleString()));
});


(async () => {
    Viewer.startViewers({
        accounts: [
            "tt_chain_token=Bd+ZLbKillJLy/X/r8rTWQ==; _ga=GA1.1.529698638.1743136912; FPID=FPID2.2.fVf4KWNe%2FkQ5CBmBhFI0zEScixZMmxQd%2BCB49UAVe4s%3D.1743136912; FPAU=1.2.1347224007.1743136912; _fbp=fb.1.1743136912245.1686913634; passport_csrf_token=f9a30644d5e1541c4840474f4cb938a9; passport_csrf_token_default=f9a30644d5e1541c4840474f4cb938a9; store-idc=alisg; store-country-code=vn; store-country-code-src=uid; tt-target-idc=alisg; multi_sids=7486744635100922887%3Aa4e5eb05b4a0e7980e27d8d606692196; cmpl_token=AgQQAPOFF-RO0rfYrDPLcl0-_YexsJ4af4UOYN_Sig; passport_auth_status=9a25aab2ad3a84807bf981cb51787441%2C7af2042fa0a953a1b249bd2748c19eed; passport_auth_status_ss=9a25aab2ad3a84807bf981cb51787441%2C7af2042fa0a953a1b249bd2748c19eed; uid_tt=17e9fc90de3076c96c3f8e9de910599d4497eccf0bfeec39ce31eec75e345eb5; uid_tt_ss=17e9fc90de3076c96c3f8e9de910599d4497eccf0bfeec39ce31eec75e345eb5; sid_tt=a4e5eb05b4a0e7980e27d8d606692196; sessionid=a4e5eb05b4a0e7980e27d8d606692196; sessionid_ss=a4e5eb05b4a0e7980e27d8d606692196; tt-target-idc-sign=EstImQHL-2XzRgfc-udviYfN2ErCuWJwdU0zOTpfX-_--Pl02n48Mn4N-8ILB-50D2hAtuvBeUIhE3GKCRIO0Sz_ai9tmvtNyyvDhI_z1z3MjjZVcuyhlimjinCIDDUk-rbngoR6-n5-zRDGc0KVH0CUmrIcCYRkQFm_qYAUoQJ7pkvaE3UZ7fIjqsoJsjfNyYsGG4eCUPVbYLdiKFoY0N-Dm5Zysexa59zfYyJO79cF3aGaA1gu9BRjn8v7UKqABKSKuXQ_WO4sHPnyYes_oPQqo73EIPTvbpXkn9dBoQDBllJCdPy0cmuE7Sj1MM8ZU6sG3bM6TVTvM4o__MiEzk8iykSn3yI6wyvESPwEdhDYRdxii72qYX4fyTu1WnzbiLodZAR0a9Qc754Q-cNH_1KmcBA550T0Ya2O0RonEI5f6FdwY6LqmAmpKVnmYCySZrosGZAJB64HYPhWbZ4EaZD5r4kREbFhRv-xqI3hrImuDt4VGMNQDrckkLTOriWZ; sid_guard=a4e5eb05b4a0e7980e27d8d606692196%7C1748016830%7C14558413%7CSat%2C+08-Nov-2025+04%3A14%3A03+GMT; sid_ucp_v1=1.0.0-KGU1NTJkNDM4ODRiMjE0OTMzM2Y3ZTE5MmZhZTU3ZWIyOWViMGNhYmMKGQiHiIKaxNKQ82cQvr3CwQYYsws4CEASSAQQAxoDbXkyIiBhNGU1ZWIwNWI0YTBlNzk4MGUyN2Q4ZDYwNjY5MjE5Ng; ssid_ucp_v1=1.0.0-KGU1NTJkNDM4ODRiMjE0OTMzM2Y3ZTE5MmZhZTU3ZWIyOWViMGNhYmMKGQiHiIKaxNKQ82cQvr3CwQYYsws4CEASSAQQAxoDbXkyIiBhNGU1ZWIwNWI0YTBlNzk4MGUyN2Q4ZDYwNjY5MjE5Ng; _ttp=2xcejOzu8fqvkF7N4yXJ7RQQpsy; tt_csrf_token=JvGnAJvu-V9q7IqT6O9SPE2ZIEAFRuWNXRF0; csrf_session_id=23561f14f835d0058f4b68ec43a57546; s_v_web_id=verify_mb4swm2c_O3dLqxT7_rntW_4L7n_8CgZ_gZXQENFrUnSM; FPLC=OKyriVyAg%2BNd%2FvlfilCH%2FIM%2FpWzFqggJaP%2F49axCeZgNliHlf58WOCns9qleJkJRKReDlZ812UYBGZDJ4qy%2FMeyiWVtbH0WwpJ0Nlj12lb0vNzcOWvZF0mgn4ix%2Frg%3D%3D; csrfToken=rf3fLetr-HhKAjKDSjZlur9m54JG0R86yY6o; _ga_LWWPCY99PB=GS1.1.1748246636.30.1.1748246657.0.0.195888261; ttwid=1%7ClOxgt8mHvQhfr6JxylDT7n86DKXiouW860c2TQ_rv6A%7C1748246658%7C332934b3652bd4ef6d85d96a693f03a84870d1ced680dd6479001bcfc3e33ef5; msToken=ct4fo5rwFBa9SDj8g__bBvneeiIG2gyCElW2lM_xXiVKjuVXHNE1RF8_q-Sivwn4QOIUyzP21Iqc5Jp3ThmwQnDdNbs7GIw4R4SpQwTonq6OF6x3TDphhoIVjrQZzIvpGf05LxUWJ3So3-6xkW92yb7QhQ==; store-country-sign=MEIEDPmnt2Djrg_v8LM_JgQgN5MHmYSh8cISMreGWHPkvH_JP4ItSyUbT13J6qyxiowEEK4jm94luVLieGPFbisbEQI; odin_tt=98cda1737ecdf3b0136251f02b050af0ff1998d092aefa2d659e4931c05d66b77536ccb928c2d7f33075dbb5817839a225207b481c935d7d63d11110329cac481da0c1e8b3c405ba130dfbcb25a0a8ac;wid=7486715974486672903;username=binhbkpro;proxy=khljtiNj3Kd:fdkm3nbjg45d@1.54.240.112:18035;"
        ], 
        task_id: "1", 
        room_id:  "7509452050606934804",
    });
    setTimeout(() => {
        Viewer.stopViewers({
            task_id: "1",
        });
    },7*60000);
})().catch(err => {
    console.error(`[Task ${task_id}] Startup error:`, err);
    process.exit(1);
});
