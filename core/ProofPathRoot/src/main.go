package main

import (
	"encoding/hex"
	"encoding/json"
	"log"
	"math"

	"strconv"
	"fmt"
	"io"
	"os"

	//"net/http"
	"crypto/sha256"
	"database/sql"
	_ "net/http/pprof"
	"sort"
	"strings"
	//_ "sqlite3"
	_ "github.com/mattn/go-sqlite3"
)

//////////////////////////////////////////////////
type any interface{}
var blockroot [][]byte

func hash256(arg ...[]byte) []byte {
	m := sha256.New()
	for _, value := range arg {
		m.Write(value)
	}
	return m.Sum(nil)
}

type MMR struct {
	db      *sql.DB
	peaks   []uint64
	root    []byte
	nodeNum uint64
}

// 打开db，返回一个MMR实例，用该实例进行增加和验证操作
func OpenDB(dataSource string) MMR {
	var mmr MMR
	db, err := sql.Open("sqlite3", dataSource) //若数据库没有在这个项目文件下，则需要写绝对路径
	if err != nil {
		fmt.Println("MMR数据库打开失败,请确认路径是否正确")
		os.Exit(0)
	}
	mmr.db = db
	mmr.nodeNum = mmr.getMaxID()
	return mmr
}
func CloseDB(mmr *MMR) {
	mmr.db.Close()
}

// 获取id值并升序排序
type array []uint64

func (a array) Len() int {
	return len(a)
}
func (a array) Swap(i, j int) {
	a[i], a[j] = a[j], a[i]
}
func (a array) Less(i, j int) bool {
	return a[i] < a[j]
}
func itemSort(m map[uint64][]byte) []uint64 {
	var a []uint64

	for k, _ := range m {
		a = append(a, k)
	}

	sort.Sort(array(a[:]))
	return a[:]
}

// 根据index找兄弟;没有兄弟的返回值是0
func Find_bro_by_ID(id uint64, maxID uint64) uint64 {
	//MMR树结点个数
	//maxID:=mmr.nodeNum
	//id对应结点高度
	height := GetHeightByID(id)
	if id > maxID {
		// id越界，右兄弟一定不存在，只能找找左兄弟
		id_bro := id - (2 << height) + 1
		if id_bro >= 0 && height == GetHeightByID(id_bro) {
			return id_bro
		}
		return 0
	}
	// 找右兄弟 +2^(h+1)-1
	id_bro := id + (2 << height) - 1
	// 满足要求，节点存在，高度一样，找到了右兄弟
	if id_bro < maxID && height == GetHeightByID(id_bro) {
		return id_bro
	}
	// 否则 找左兄弟
	id_bro = id - (2 << height) + 1
	if id_bro >= 0 && height == GetHeightByID(id_bro) {
		return id_bro
	}
	return 0
}

// 根据id找父节点；没有父节点返回值是-1；
func Find_parent_by_ID(id uint64, maxID uint64) uint64 {
	//MMR树结点个数
	//maxID:=mmr.nodeNum
	if id > maxID {
		// id越界，如果它有孤儿兄弟，右上方找它的孤儿父母
		height := GetHeightByID(id)
		height_next := GetHeightByID(id + 1)
		if height < height_next {
			return id + 1
		}
		return 0
	}
	//id对应结点高度
	height := GetHeightByID(id)
	height_next := GetHeightByID(id + 1)
	if height < height_next {
		if id+1 <= maxID {
			return id + 1
		}
	} else {
		if id+2<<height <= maxID {
			return id + 2<<height
		}
	}
	return 0
}

// 找到数据库MMR树的所有山峰，并把山峰id临时保存到mmr.peaks[]中
func FindPeak(num uint64) []uint64 {
	//清空旧的山峰数据
	peaks := make([]uint64, 0, 0)
	// 所有山峰存入self.peak列表
	// 由于默克尔山脉由从左到右的多个山构成，每个山都是完美二叉树，单独的叶子结点也是一座山，每座山的结点数量满足N=2^x-1
	// 因此，只需要将mmr_list的结点数量最大拆分成满足N=2^x-1的几个部分（山），山的数量便是山峰的数量
	//       /'\
	//     /\  /\    /'\
	//    /\/\/\/\  /\ /\  /'\
	// num 结点总数量
	// 获取最大2的整数次幂-1;max_global对应整个山脉当前关注的山峰的编号
	var maxGlobal uint64 = 0
	for num > 0 {
		// 获取当前山峰从1开始的结点标号; num+1避免1,3,7,15,31等恰好2^x-1的值被漏掉；
		maxPart := MaxIntPower2(num+1) - 1
		// 之前的山已经找到了山峰，关注更低矮的山
		num -= maxPart
		maxGlobal += maxPart
		// 示意图结点从1开始标号，对应的数据库ID从1开始标号
		peaks = append(peaks, maxGlobal)
	} //end for
	return peaks
}

// 根据ID确定高度
func GetHeightByID(id uint64) uint64 {
	for {
		max_ := MaxIntPower2(id + 1)
		if id+1 == max_ {
			return uint64(math.Log2(float64(max_))) - 1
		}
		id = id + 1 - max_
	}
}

// 小于等于x的最大2的整数次方
func MaxIntPower2(x uint64) uint64 {
	x |= x >> 1
	x |= x >> 2
	x |= x >> 4
	x |= x >> 8
	x |= x >> 16
	x |= x >> 32
	return x - (x >> 1)
}
func GetMMRTreeHeight(maxID uint64) uint64 {
	max_ := MaxIntPower2(maxID + 1)
	return uint64(math.Log2(float64(max_))) - 1
}

// 根据block_list的index确定对应的Node在数据库的id
// 例如输入的index=9（从0开始）,这些节点对应叶子，都在mmr的底部，将这些叶子按照2的最大整数次幂划分给一座座山当底座
// 山是完美二叉树，其叶子个数n0=2^x，总节点个数N=2*n0-1
func Find_mmr_ID_by_block_index(blockindex any) any {
	switch blockindex.(type) {
	case uint64:
		var index uint64 = blockindex.(uint64)
		var target uint64 = 1
		for index > 0 {
			max_ := MaxIntPower2(index)
			target += 2*max_ - 1
			index -= max_
		}
		return target
	case []uint64:
		results := make(map[uint64]uint64)
		for _, index := range blockindex.([]uint64) {
			var target uint64 = 1
			for index > 0 {
				max_ := MaxIntPower2(index)
				target += 2*max_ - 1
				index -= max_
			}
			results[target] = target
		}
		return results
	case map[uint64][]byte:
		results := make(map[uint64][]byte)
		for index, hashvalue := range blockindex.(map[uint64][]byte) {
			var target uint64 = 1
			for index > 0 {
				max_ := MaxIntPower2(index)
				target += 2*max_ - 1
				index -= max_
			}
			results[target] = hashvalue
		}
		return results
	}
	return nil
}

// 根据mmr_list的叶子ID 确定 block_list的index
func Find_block_index_by_mmr_ID(id uint64) uint64 {
	var target uint64 = 0
	for id > 0 {
		max_ := MaxIntPower2(id + 1)
		target += max_ / 2
		id = id + 1 - max_
	}
	return target - 1
}

// 数据库访问操作
// 创建表

// 获取数据库最大ID，即节点总个数
func (mmr *MMR) getMaxID() uint64 {
	rows, err := mmr.db.Query("SELECT ID FROM MMRTREE WHERE id=(SELECT MAX(ID) FROM MMRTREE)")
	checkErr(err)
	var id uint64 = 0
	for rows.Next() {
		err = rows.Scan(&id)
		checkErr(err)
		//fmt.Println("id:",id)
	}
	return id
}

// 通过ID从数据库查询节点哈希值
func (mmr *MMR) getHashValueByID(id uint64) []byte {
	rows, err := mmr.db.Query("SELECT HASHVALUE FROM MMRTREE WHERE id=?", id)
	checkErr(err)
	var hashValue []byte
	for rows.Next() {
		err = rows.Scan(&hashValue)
		checkErr(err)
	}
	return hashValue
}

// 错误处理
func checkErr(err error) {
	if err!=nil{
		fmt.Println("err:",err)
	}
}

func(mmr *MMR) GetHashByID(ids[] uint64) map[uint64][]byte {
	var hash []byte
	result := make(map[uint64][]byte)
	var icount uint64 =0
	for i:=0;i<len(ids);i+=10000{//不能一次性从数据库取太多
		//t1:=time.Now()
		var x []interface{}
		var end int
		if len(ids)-10000>i{
			end=10000
		}else{
			end=len(ids)-i
		}
		for _,item:=range ids[i:i+end]{
			x=append(x, item)
		}

		s:="SELECT HASHVALUE FROM MMRTREE WHERE id in "
		s+="("
		s+=strings.Repeat("?,", len(x)-1)
		s+="?)"

		//t2:=time.Since(t1)

		rows,err:=mmr.db.Query(s,x...)
		//t3:=time.Since(t1)
		//fmt.Println(t2,t3)
		if err!=nil{
			fmt.Println("err:",err)
			os.Exit(0)
		}
		for rows.Next() {
			err = rows.Scan(&hash)
			checkErr(err)
			t := ids[icount]
			icount++
			result[t] = hash
		}
	}
	return result
}

func getPeaksHeightID(maxID uint64) (peaksHeightID map[uint64]uint64) {
	peaks := FindPeak(maxID)
	peaksHeightID = make(map[uint64]uint64)
	//peaksHeightID:=make(map[uint64]uint64)
	for _, id := range peaks {
		peaksHeightID[GetHeightByID(id)] = id
	}
	return peaksHeightID
}

func bagPeaks(peaks map[uint64][]byte) []byte {
	sortedid := itemSort(peaks)
	i := len(sortedid) - 1
	result := peaks[sortedid[i]]
	for ; i >= 1; i-- {
		left := sortedid[i-1]
		result = hash256(peaks[left], result)
	}
	return result
}

func (mmr *MMR) GenProofPath(BlockNums []uint64,MAXID uint64) (proofPath map[uint64][]byte) {
	proofPath = make(map[uint64][]byte)
	IDS := Find_mmr_ID_by_block_index(BlockNums).(map[uint64]uint64)
	treeHeight := GetMMRTreeHeight(MAXID)
	peaksHeightId := getPeaksHeightID(MAXID)
	var path []uint64
	for h := uint64(0); h <= treeHeight; h++ {
		temp := make(map[uint64]uint64)
		for _, id := range IDS {
			parid := uint64(0)
			if id > MAXID { //虚节点，跳过，该层山峰交由外层处理
				continue
			}
			//右孩子
			if h+1 == GetHeightByID(id+1) {
				lid := id - (2 << h) + 1
				parid = id + 1
				_, flag := IDS[lid]
				if !flag {
					path = append(path, lid)
				}
			} else { //山峰或者左孩子
				rid := id + (2 << h) - 1
				if rid < MAXID { //是左孩子
					parid = id + (2 << h)
					_, flag := IDS[rid]
					if !flag {
						path = append(path, rid)
					}
				} else { // 是山峰
					continue
				}
			}
			temp[parid] = parid
		}
		//处理该层山峰节点
		peakID, flag := peaksHeightId[h]
		if flag {
			_, flag := IDS[peakID]
			if !flag {
				path = append(path, peakID)
			}
		}
		IDS = temp
	}
	sort.Sort(array(path))
	proofPath = mmr.GetHashByID(path)
	return proofPath
}

func (mmr *MMR) CreatProofRoot(proofPath map[uint64][]byte, blockNumsHash map[uint64][]byte,MAXID uint64) (root []byte) {
	IDsHash := make(map[uint64][]byte)
	if blockNumsHash != nil {
		IDsHash = Find_mmr_ID_by_block_index(blockNumsHash).(map[uint64][]byte)
	}
	peaksIDHash := make(map[uint64][]byte)
	treeHeight := GetMMRTreeHeight(MAXID)
	peaksHeightId := getPeaksHeightID(MAXID)
	// 按层处理
	for h := uint64(0); h <= treeHeight; h++ {
		temp := make(map[uint64][]byte)
		//处理一层
		for k, v := range IDsHash {
			bro := Find_bro_by_ID(k, MAXID)
			if bro != 0 {
				broHash, flag := proofPath[bro]
				if !flag {
					broHash, _ = IDsHash[bro]
				}
				par := Find_parent_by_ID(k, MAXID)
				if k < bro {
					temp[par] = hash256(v, broHash)
				} else {
					temp[par] = hash256(broHash, v)
				}
			} else {
				//山峰
				peaksIDHash[k] = v
			}
		}
		//处理该层山峰节点
		peakID, flag := peaksHeightId[h]
		if flag { //该层有山峰
			_, flag = IDsHash[peakID]
			if !flag { //山峰没有处理过
				// 山峰的hashValue从proofPath获取
				peakhash, flag := proofPath[peakID]
				if flag {
					peaksIDHash[peakID] = peakhash
				}
			}
		}

		// 处理上面一层
		IDsHash = temp
	}
	root = bagPeaks(peaksIDHash)
	return root
}

func (mmr *MMR) Show() {
	rows, err := mmr.db.Query("SELECT * FROM MMRTREE ")
	checkErr(err)
	for rows.Next() {
		var s []byte
		var id int
		err = rows.Scan(&id, &s)
		checkErr(err)
		fmt.Println(id, hex.EncodeToString(s))
	}
}

//////////////////////////////////////////////////

func Encode(inputs map[uint64][]byte) []byte {
	//result:=mmr.GenProofPath(BlockNums)
	js, err := json.Marshal(inputs)
	if err != nil {
		fmt.Println("Encde err:", err)
	}
	return js
}
func Decode(input []byte) map[uint64][]byte {
	result := make(map[uint64][]byte)
	err := json.Unmarshal(input, &result)
	if err != nil {
		fmt.Println("Decode err:", err)
	}
	return result
}

func storeJSON(filepath string, data []byte) {
	// os.Create() 创建文件，若已经存在则截断
	fs, err := os.Create(filepath)
	if err != nil {
		fmt.Println(err)
		return
	}
	_, err = fs.Write(data)
	if err != nil {
		fmt.Println("保存JSON文件失败,err:", err)
		return
	}
	err = fs.Close()
	if err != nil {
		fmt.Println("关闭JSON文件失败,err:", err)
	}
}

func loadJSON(filepath string) []byte {
	//没有声明长度最终读取的结果就是0
	var data []byte
	buf := make([]byte, 1024)
	fs, err := os.Open(filepath)
	if err != nil {
		fmt.Println("打开JSON文件失败,err:", err)
	}
	for {
		// 将文件中读取的byte存储到buf中
		n, err := fs.Read(buf)
		if err != nil && err != io.EOF {
			log.Fatal(err)
		}
		if n == 0 {
			break
		}
		// 将读取到的结果追加到data切片中
		data = append(data, buf[:n]...)
	}

	fs.Close()
	return data
}

func main() {
	//main参数处理
	fmt.Println(os.Args)
	//根据-p  -r  判断是找路径还是生成root
	var blockNums []uint64
	var jsonpath string
	if os.Args[1] == "-p" {
		blocknumspath := os.Args[2]
		jsonpath = os.Args[3]
		MMRDB:=os.Args[4]
		blockMaxNumStr := os.Args[5]
		re, err := strconv.ParseInt(blockMaxNumStr, 10, 64)
		if err != nil {
			fmt.Println("最大块号从字符串转为数字失败,err:", err)
			return
		}
		fmt.Println(re)
		//根据下一个将要存入MMR的block块号计算MMR节点个数，最后一block还没有存入MMR
		nextNodeid := Find_mmr_ID_by_block_index(uint64(re)).(uint64)


		fmt.Println("blocknumspath:", blocknumspath, "proofpath:", jsonpath)

		//拿块号
		blockjs := loadJSON(blocknumspath)
		blocknums := make(map[uint64]uint64)
		err = json.Unmarshal(blockjs, &blocknums)
		if err != nil {
			fmt.Println("blocknums解码失败,err:", err)
		}
		fmt.Println("块号", blocknums)
		for _, v := range blocknums {
			blockNums = append(blockNums, v)
		}

		mmr := OpenDB(MMRDB)
	
		proofPath := mmr.GenProofPath(blockNums,nextNodeid-uint64(1))
		CloseDB(&mmr)
		// print path byte type
		for k, v := range proofPath {
			fmt.Println("key:", k, "value:", v)
		}

		//fmt.Println(proofPath)

		encoderesult := Encode(proofPath)
		storeJSON(jsonpath, encoderesult)

		//loadata := loadJSON(jsonpath)
		//fmt.Println("encodedata:", encoderesult, "loaddata:", loadata)

		//decoderesult := Decode(loadata)
		//fmt.Println(decoderesult)

	} else if os.Args[1] == "-r" {
		blockpath := os.Args[2]
		proofpath := os.Args[3]
		blockMaxNumStr:=os.Args[4]
		re, err := strconv.ParseInt(blockMaxNumStr, 10, 64)
		if err != nil {
			fmt.Println("最大块号从字符串转为数字失败,err:", err)
			return
		}

		//根据下一个将要存入MMR的block块号计算MMR节点个数，最后一block还没有存入MMR
		nextNodeid := Find_mmr_ID_by_block_index(uint64(re))

		mmr := MMR{}
		MAXID := nextNodeid.(uint64)-1

		bjs := loadJSON(blockpath)
		pjs := loadJSON(proofpath)
		//解码
		bl := Decode(bjs)
		pr := Decode(pjs)
		
		
		// 输出一下proofPath解码的内容，看与保存到JSON前是否一致
		for k, v := range pr {
			fmt.Println("key:", k, "value:", v)
		}


		fmt.Println("bl:", bl, "pr:", pr)
		root := mmr.CreatProofRoot(pr, bl,MAXID)
		fmt.Println("ProofROOT", root)

		result := make(map[string][]byte)
		result["ProofRoot"] = root
		rejs, err := json.Marshal(result)
		if err != nil {
			fmt.Println(err)
		}
		storeJSON("./ProofROOT.json", rejs)

	} else {
		fmt.Println("参数错误")
	}

	//MMR.Remove("./test.db")

	// start0 := time.Now() // 获取当前时间
	// blockNumsHash := make(map[uint64][]byte)
	// //r1 := rand.New(rand.NewSource(time.Now().UnixNano()))
	// for i := 0; i < 3; i++ {
	// 	y := rand.Intn(15)
	// 	blockNumsHash[uint64(y)] = hash256([]byte(fmt.Sprintf("%d", y)))
	// }
	// blockNumsHash[uint64(0)] = hash256([]byte(fmt.Sprintf("%d", 0)))
	// var blockNums []uint64
	// for k, _ := range blockNumsHash {
	// 	blockNums = append(blockNums, k)
	// }
	// fmt.Println(len(blockNumsHash))
	// elapsed0 := time.Since(start0)
	// fmt.Println("该函数执行完成耗时：", elapsed0, "样本量:", len(blockNumsHash))

	// go func() {
	// 	log.Println(http.ListenAndServe(":8080", nil))
	// }()

	// 实际业务代码

	//fmt.Println("数量：", len(blockNumsHash))

	// start := time.Now() // 获取当前时间
	// icount := 0
	// for i := 0; i < 15; i++ {
	// 	mmr.NewNode(hash256([]byte(fmt.Sprintf("%d", i))), uint64(i))
	// 	icount++
	// }

	// elapsed := time.Since(start)
	// fmt.Println("单路查询函数执行完成耗时：", elapsed, "样本量:", icount)
	// start2 := time.Now() // 获取当前时间

	// proofroot := mmr.CreatProofRoot(proofPath, blockNumsHash)
	// oldroot := mmr.GetRoot()
	// if string(oldroot) == string(proofroot) {
	// 	fmt.Println("验证成功")
	// } else {
	// 	fmt.Println("验证失败")
	// }
	//elapsed2 := time.Since(start2)
	//fmt.Println("多路查询函数执行完成耗时：", elapsed2, "样本量:", len(blockNumsHash))

	//fmt.Println(blockNumsHash)

}

/*
func main() {
	mmr := OpenDB("./MMR.db")

	mmr.Show()

	CloseDB(&mmr)
}
*/

